import React, { useEffect, useState } from "react";
import { generateClient } from "aws-amplify/api";
import { updateUser, updateRole } from "graphql/mutations";
import { fetchUserAttributes } from "aws-amplify/auth";
import Banner from "./components/Banner";

const client = generateClient();

const AdminUserManager = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [areas, setAreas] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCurrent = async () => {
      try {
        const attributes = await fetchUserAttributes();
        const email = attributes.email;

        const res = await client.graphql({
          query: /* GraphQL */ `
            query ListUsers($filter: ModelUserFilterInput) {
              listUsers(filter: { and: [{ _deleted: { ne: true } }, $filter] }) {
                items {
                  id
                  email
                  roleID
                  role {
                    id
                    name
                  }
                }
              }
            }
          `,
          variables: {
            filter: {
              email: { eq: email },
            },
          }
        });

        const userData = res.data.listUsers.items[0];
        if (userData) {
          setCurrentUser(userData);
        } else {
          console.warn("El usuario no existe en la base de datos.");
        }
      } catch (err) {
        console.error("Error obteniendo atributos o usuario:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCurrent();
  }, []);

  useEffect(() => {
    if (currentUser?.role?.name === "Admin") {
      fetchData();
    } else if (currentUser && currentUser.role?.name !== "Admin") {
      // Si no es admin, dejamos de cargar
      setIsLoading(false);
    }
  }, [currentUser]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [usersRes, rolesRes, areasRes] = await Promise.all([
        client.graphql({
          query: /* GraphQL */ `
            query ListUsers {
              listUsers(filter: { _deleted: { ne: true } }) {
                items {
                  id
                  email
                  roleID
                  role {
                    id
                    name
                  }
                }
              }
            }
          `,
        }),
        client.graphql({
          query: /* GraphQL */ `
            query ListRoles {
              listRoles(filter: { _deleted: { ne: true } }) {
                items {
                  id
                  name
                  areas
                }
              }
            }
          `,
        }),
        client.graphql({
          query: /* GraphQL */ `
            query ListAreas {
              listAreas(filter: { _deleted: { ne: true } }) {
                items {
                  id
                  title
                  description
                }
              }
            }
          `,
        }),
      ]);
  
      setUsers(usersRes.data.listUsers.items);
      setRoles(rolesRes.data.listRoles.items);
      setAreas(areasRes.data.listAreas.items);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setIsLoading(false);
    }
  };
  

  const assignRoleToUser = async (userId, roleId) => {
    if (userId === currentUser.id && roles.find(r => r.id === roleId)?.name !== "Admin") {
      alert("No puedes eliminar tu propio rol de Admin.");
      return;
    }
  
    // ✅ Obtener _version actual del usuario
    const userData = await client.graphql({
      query: /* GraphQL */ `
        query GetUser($id: ID!) {
          getUser(id: $id) {
            id
            roleID
            _version
          }
        }
      `,
      variables: { id: userId },
    });
  
    const { _version } = userData.data.getUser;
  
    // ✅ Hacer update con _version
    await client.graphql({
      query: updateUser,
      variables: {
        input: {
          id: userId,
          roleID: roleId,
          _version,
        },
      },
    });
  
    // ✅ Actualizar estado local
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? { ...u, roleID: roleId, role: roles.find((r) => r.id === roleId) }
          : u
      )
    );
  
    if (userId === currentUser.id) {
      setCurrentUser((prev) => ({
        ...prev,
        roleID: roleId,
        role: roles.find((r) => r.id === roleId),
      }));
    }
  };

  const updateRoleAreas = async (roleId, areaIds) => {
    const unique = [...new Set(areaIds)];
  
    // ✅ Obtener la versión actual del rol
    const roleData = await client.graphql({
      query: /* GraphQL */ `
        query GetRole($id: ID!) {
          getRole(id: $id) {
            id
            areas
            _version
          }
        }
      `,
      variables: { id: roleId },
    });
  
    const { _version } = roleData.data.getRole;
  
    // ✅ Enviar _version en la mutación
    await client.graphql({
      query: updateRole,
      variables: {
        input: {
          id: roleId,
          areas: unique,
          _version, // IMPORTANTE para que funcione en Amplify v2
        },
      },
    });
  
    // ✅ Actualizar estado local
    setRoles((prev) =>
      prev.map((r) => (r.id === roleId ? { ...r, areas: unique } : r))
    );
  };

  // Ordenar usuarios por rol: Admin primero, luego alfabéticamente por nombre de rol
  // IMPORTANTE: Los hooks deben estar antes de cualquier return condicional
  const sortedUsers = React.useMemo(() => {
    return [...users].sort((a, b) => {
      const roleA = a.role?.name || "Sin rol";
      const roleB = b.role?.name || "Sin rol";

      // Admin siempre primero
      if (roleA === "Admin" && roleB !== "Admin") return -1;
      if (roleA !== "Admin" && roleB === "Admin") return 1;

      // Sin rol siempre al final
      if (roleA === "Sin rol" && roleB !== "Sin rol") return 1;
      if (roleA !== "Sin rol" && roleB === "Sin rol") return -1;

      // Resto ordenado alfabéticamente
      return roleA.localeCompare(roleB);
    });
  }, [users]);


  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] w-full flex-col items-center justify-center p-3">
        <span className="loader"></span>
        <h2 className="mt-4 text-center text-xl">
          Cargando permisos...
        </h2>
      </div>
    );
  }

  if (!currentUser || currentUser.role?.name !== "Admin") {
    return (
      <div className="flex items-center justify-center mt-5 px-4">
        <div className="p-6 border border-red-200 rounded-xl shadow-sm max-w-md w-full text-center">
          <h2 className="text-xl font-semibold text-brand-500 mb-2">Acceso denegado</h2>
          <p>No tienes permisos para acceder a esta sección. Si crees que esto es un error, contacta con el administrador del sistema.</p>
        </div>
      </div>
    );
  }

  return (

    <div className="admin-manager-page">

      <div className="grid h-full">
        <Banner />
      </div>

      <div className="max-w-6xl">
        <h2 className="text-2xl font-bold mb-6">Gestión de Usuarios y Roles</h2>

        <div className="overflow-hidden rounded-xl border border-gray-200 mb-10 shadow-sm">
          <table className="min-w-full text-left">
            <thead className="bg-[#f8f9fb]">
              <tr>
                <th className="p-3 border-b border-r border-gray-200">Email</th>
                <th className="p-3 border-b border-r border-gray-200">Rol Actual</th>
                <th className="p-3 border-b border-gray-200">Asignar Nuevo Rol</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {sortedUsers.map((u, index) => (
                <tr key={u.id} className={index !== sortedUsers.length - 1 ? "border-b border-gray-200" : ""}>
                  <td className="p-2 border-r border-gray-200">{u.email}</td>
                  <td className="p-2 border-r border-gray-200">{u.role?.name || "Sin rol"}</td>
                  <td className="py-[10px] px-4">
                    <select
                      value={u.roleID || ""}
                      onChange={(e) => assignRoleToUser(u.id, e.target.value)}
                      className="border border-gray-300 my-1 px-3 py-2 rounded-md w-full focus:outline-none focus:border-brand-500"
                    >
                      <option value="">Seleccionar</option>
                      {roles.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2 className="text-xl font-bold mb-4">Permisos por Área por Rol</h2>
        {roles.map((r) => (
        <div key={r.id} className="mb-6 border border-gray-200 py-3 px-4 rounded-xl shadow-sm bg-white">
          <h3 className="font-semibold mb-3 text-lg">{r.name}</h3>

          {/* 🚫 Skip area assignment UI for Admin */}
          {r.name === "Admin" ? (
            <p className="text-sm text-[#848484]">
              El rol Admin tiene acceso completo y no requiere asignación de áreas.
            </p>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                {areas.map((a) => {
                  const currentAreas = Array.isArray(r.areas) ? r.areas : [];
                  const isChecked = currentAreas.includes(a.id);
                  return (
                    <label key={a.id} className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          const currentAreas = Array.isArray(r.areas) ? r.areas : [];
                          const updatedAreas = isChecked
                            ? currentAreas.filter((id) => id !== a.id) // ✅ Remove
                            : [...new Set([...currentAreas, a.id])];   // ✅ Add
                        
                          // ✅ Primero actualizamos backend
                          updateRoleAreas(r.id, updatedAreas);
                        }}
                      />
                      <span>{a.title}</span>
                    </label>
                  );
                })}
              </div>
              <p className="mt-2 text-sm text-gray-600">
                Áreas asignadas:{" "}
                {(r.areas || [])
                  .map((id) => areas.find((a) => a.id === id)?.title)
                  .filter(Boolean)
                  .join(", ")}
              </p>
            </>
          )}
        </div>
      ))}

      </div>
    </div>
  );
};

export default AdminUserManager;