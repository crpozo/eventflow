import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { fetchUserAttributes } from "aws-amplify/auth";
import { generateClient } from "aws-amplify/api";

const client = generateClient();

// Context default value (while loading)
const Ctx = createContext({
  loading: true,
  isAdmin: false,
  user: undefined,
});

export const PermissionsProvider = ({ children }) => {
  const [state, setState] = useState({
    loading: true,
    isAdmin: false,
    user: undefined,
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
        const isAdmin = user?.role?.name === "Admin";

        if (mounted) setState({ loading: false, user, isAdmin: !!isAdmin });
      } catch (err) {
        console.error("PermissionsProvider error:", err);
        if (mounted) setState((s) => ({ ...s, loading: false }));
      }
    })();

    return () => { mounted = false; };
  }, []);

  const value = useMemo(() => state, [state]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

// Convenience hook for consuming the context
export const usePermissions = () => useContext(Ctx);
