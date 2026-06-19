import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { fetchUserAttributes } from "aws-amplify/auth";
import { generateClient } from "aws-amplify/api";
import { DataStore } from "aws-amplify/datastore";
import { EventPermission } from "models";

const client = generateClient();

// Context default value (while loading)
const Ctx = createContext({
  loading: true,
  isAdmin: false,
  isReportesOnly: false,
  user: undefined,
  roleName: undefined,
  eventCapsByEvent: {},
  isManaged: false,
  // null = no restriction (admin / legacy "all"); array = allowed ids.
  areaIDsAllowed: null,
  campusIDsAllowed: null,
  can: () => true,
  canSeeArea: () => true,
  canSeeCampus: () => true,
});

// Loads the Campus->Area->Event hierarchy and resolves the per-user grants
// (campusIDs/areaIDs/eventIDs) into the flat set of allowed area & campus ids.
// A granted campus implies its areas; a granted event implies its area.
async function resolveHierarchicalAccess(grants) {
  const campusGrant = (grants.campusIDs || []).filter(Boolean);
  const areaGrant = (grants.areaIDs || []).filter(Boolean);
  const eventGrant = (grants.eventIDs || []).filter(Boolean);
  if (!campusGrant.length && !areaGrant.length && !eventGrant.length) {
    return null; // no per-user permissions -> caller falls back to legacy
  }

  const [areasRes, careersRes, eventsRes] = await Promise.all([
    client.graphql({
      query: `query { listAreas(filter: { _deleted: { ne: true } }, limit: 2000) { items { id campusID } } }`,
    }),
    client.graphql({
      query: `query { listCareers(filter: { _deleted: { ne: true } }, limit: 5000) { items { id areaID } } }`,
    }),
    client.graphql({
      query: `query { listEvents(filter: { _deleted: { ne: true } }, limit: 5000) { items { id careerID } } }`,
    }),
  ]);

  const areas = areasRes.data.listAreas.items;
  const careers = careersRes.data.listCareers.items;
  const events = eventsRes.data.listEvents.items;

  const areaToCampus = {};
  areas.forEach((a) => { areaToCampus[a.id] = a.campusID; });
  const careerToArea = {};
  careers.forEach((c) => { careerToArea[c.id] = c.areaID; });
  const eventToArea = {};
  events.forEach((e) => { eventToArea[e.id] = careerToArea[e.careerID]; });

  const campusSet = new Set(campusGrant);
  const areaSet = new Set(areaGrant);
  // granted campus -> all its areas
  areas.forEach((a) => { if (campusSet.has(a.campusID)) areaSet.add(a.id); });
  // granted event -> its area
  eventGrant.forEach((evId) => {
    const areaId = eventToArea[evId];
    if (areaId) areaSet.add(areaId);
  });
  // effective campuses = granted campuses + campuses of effective areas
  areaSet.forEach((areaId) => {
    const campusId = areaToCampus[areaId];
    if (campusId) campusSet.add(campusId);
  });

  return {
    areaIDsAllowed: [...areaSet],
    campusIDsAllowed: [...campusSet],
  };
}

export const PermissionsProvider = ({ children }) => {
  const [state, setState] = useState({
    loading: true,
    isAdmin: false,
    isReportesOnly: false,
    user: undefined,
    roleName: undefined,
    eventCapsByEvent: {},
    isManaged: false,
    areaIDsAllowed: null,
    campusIDsAllowed: null,
  });

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        // 1) get current user email from Amplify Auth
        const { email } = await fetchUserAttributes();

        // 2) query your Users table by email
        const res = await client.graphql({
          query: /* GraphQL */ `
            query ListUsers($filter: ModelUserFilterInput) {
              listUsers(filter: $filter) {
                items { id email role { id name areas } }
              }
            }
          `,
          variables: { filter: { email: { eq: email }, _deleted: { ne: true } } },
        });

        // ensure we only read .data when it's a query/mutation (not subscription)
        const user = "data" in res ? res.data?.listUsers?.items?.[0] : undefined;
        const roleName = user?.role?.name;
        const isAdmin = roleName === "Admin";
        const isReportesOnly = roleName === "Reportes";

        // Log user role information
        console.log("=== USER ROLE INFO ===");
        console.log("User:", user);
        console.log("Role Name:", roleName);
        console.log("Is Admin:", isAdmin);
        console.log("Is Reportes Only:", isReportesOnly);
        console.log("Role Areas:", user?.role?.areas);
        console.log("======================");

        // 3) load per-event permissions for this user (if any).
        // Absent until 'amplify push' provisions EventPermission — degrades to [].
        let eventCapsByEvent = {};
        let isManaged = false;
        if (user?.id && !isAdmin) {
          try {
            const perms = await DataStore.query(EventPermission, (p) =>
              p.userID.eq(user.id)
            );
            isManaged = perms.length > 0;
            eventCapsByEvent = perms.reduce((acc, p) => {
              acc[p.eventID] = (p.capabilities || []).filter(Boolean);
              return acc;
            }, {});
          } catch (e) {
            console.warn("EventPermission not available yet:", e?.message);
          }
        }

        // 4) resolve hierarchical campus/area/event access for non-admins.
        // The per-user fields and the resolution both degrade gracefully when
        // the schema isn't deployed yet (-> legacy role.areas).
        let areaIDsAllowed = null; // null = no restriction
        let campusIDsAllowed = null;
        if (user?.id && !isAdmin) {
          try {
            const grantsRes = await client.graphql({
              query: /* GraphQL */ `
                query ($id: ID!) {
                  getUser(id: $id) { campusIDs areaIDs eventIDs }
                }
              `,
              variables: { id: user.id },
            });
            const g = grantsRes.data?.getUser || {};
            const resolved = await resolveHierarchicalAccess(g);
            if (resolved) {
              areaIDsAllowed = resolved.areaIDsAllowed;
              campusIDsAllowed = resolved.campusIDsAllowed;
            } else {
              // No per-user grants: keep legacy role.areas for areas, all campuses.
              areaIDsAllowed = (user.role?.areas || []).filter(Boolean);
              campusIDsAllowed = null;
            }
          } catch (e) {
            console.warn("Hierarchical access not available yet:", e?.message);
            areaIDsAllowed = (user.role?.areas || []).filter(Boolean);
            campusIDsAllowed = null;
          }
        }

        if (mounted)
          setState({
            loading: false,
            user,
            isAdmin: !!isAdmin,
            isReportesOnly: !!isReportesOnly,
            roleName,
            eventCapsByEvent,
            isManaged,
            areaIDsAllowed,
            campusIDsAllowed,
          });
      } catch (err) {
        console.error("PermissionsProvider error:", err);
        if (mounted) setState((s) => ({ ...s, loading: false }));
      }
    })();

    return () => { mounted = false; };
  }, []);

  const value = useMemo(() => {
    // can(eventId, section, action): Admin -> always; unmanaged users keep
    // legacy (area-based) access; managed users are enforced per token.
    const can = (eventId, section, action = "view") => {
      if (state.isAdmin) return true;
      if (!state.isManaged) return true;
      const caps = state.eventCapsByEvent[eventId] || [];
      return caps.includes(`${section}:${action}`);
    };
    const canSeeArea = (areaId) =>
      state.isAdmin || state.areaIDsAllowed == null || state.areaIDsAllowed.includes(areaId);
    const canSeeCampus = (campusId) =>
      state.isAdmin || state.campusIDsAllowed == null || state.campusIDsAllowed.includes(campusId);
    return { ...state, can, canSeeArea, canSeeCampus };
  }, [state]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

// Convenience hook for consuming the context
export const usePermissions = () => useContext(Ctx);
