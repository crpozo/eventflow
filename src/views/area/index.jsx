import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Banner from "./components/Banner";
import NftCard from "components/card/NftCard";
import { DataStore } from 'aws-amplify/datastore';
import { Area } from "models";
import { fetchUserAttributes } from "aws-amplify/auth";
import { generateClient } from "aws-amplify/api";
import {
  MdAdd,
  MdChevronLeft
} from "react-icons/md";
import { AiOutlineWarning } from "react-icons/ai";

const client = generateClient();

const Dashboard = () => {
  const [areas, setAreas] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const navigate = useNavigate();
  const campusID = JSON.parse(localStorage.getItem("EVENTFLOW.campus"))?.id;

  useEffect(() => {
    if (!campusID) {
      navigate('/page/campus');
    }

    const fetchUserAndAreas = async () => {
      try {
        const attributes = await fetchUserAttributes();
        const email = attributes.email;

        // 🔎 Buscar al usuario en la base de datos
        const res = await client.graphql({
          query: /* GraphQL */ `
            query ListUsers($filter: ModelUserFilterInput) {
              listUsers(filter: $filter) {
                items {
                  id
                  email
                  role {
                    id
                    name
                    areas
                  }
                }
              }
            }
          `,
          variables: {
            filter: {
              email: { eq: email },
              _deleted: { ne: true }
            }
          }
        });

        const user = res.data.listUsers.items[0];
        if (!user) throw new Error("Usuario no encontrado");

        setCurrentUser(user);

        // 🔄 Obtener todas las áreas del campus
        const allAreasRes = await DataStore.query(Area, (a) => a.campusID.eq(campusID));

        // ✅ Filtrar según rol
        if (user.role?.name === "Admin") {
          setAreas(allAreasRes);
        } else {
          const allowedAreaIds = user.role?.areas || [];
          const filteredAreas = allAreasRes.filter((a) => allowedAreaIds.includes(a.id));
          setAreas(filteredAreas);
        }

      } catch (error) {
        console.error("Error cargando datos del usuario o áreas:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserAndAreas();
  }, [campusID, navigate]);

  if (isLoading) {
    return (
      <div className="fixed bottom-0 left-0 right-0 top-[-10px] z-50 flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-lightPrimary opacity-[100%] p-3">
        <span className="loader"></span>
        <h2 className="mb-2 text-center text-xl text-black">
          Cargando...
        </h2>
      </div>
    );
  }

  return (
    <div className="campus-page">
      <div className="grid h-full">
        <Banner />
      </div>

      <div className="!z-5 relative flex flex-col bg-white bg-clip-border shadow-card px-[25px] py-[25px] rounded-[20px] dark:!bg-navy-800 dark:text-white dark:shadow-none !z-5 overflow-hidden">
        <div className="flex flex-col items-center justify-between gap-3 mb-4 sm:flex-row sm:gap-0">
          <p className="text-2xl font-medium text-navy-700 dark:text-white">
            Área académica
          </p>
          {currentUser?.role?.name === "Admin" && (
            <Link className="hover:no-underline" to="crear">
              <button className="linear flex items-center gap-1 pr-3 pl-3 rounded-xl bg-brand-500 py-[12px] text-sm font-medium text-white transition duration-200 hover:bg-black">
                Crear Área <MdAdd className="h-4 w-4" />
              </button>
            </Link>
          )}
        </div>

        {areas.length !== 0 ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4 3xl:grid-cols-4 mb-4">
            {areas
              .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
              .map((area) => (
                <NftCard
                  modelName="area"
                  modelID={area.id}
                  model={area}
                  pathSelect="subarea/"
                  pathEdit="editar/"
                  key={area.id}
                  color="bg-lightGray"
                  date={area.updatedAt}
                  title={area.title}
                  cat="Seleccionar"
                />
              ))}
          </div>
        ) : (
          <p className="flex gap-2 items-center">
            <AiOutlineWarning /> No existen áreas disponibles para tu rol en este campus...
          </p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
