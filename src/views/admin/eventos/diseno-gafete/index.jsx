import React, { useState } from 'react';
import { useNavigate, useParams } from "react-router-dom";
import Banner from "./components/Banner";
import { DataStore } from 'aws-amplify/datastore';
import { uploadData, remove, getUrl } from 'aws-amplify/storage';
import { generateClient } from 'aws-amplify/api';
import { createBadge, updateBadge, updateEvent } from 'graphql/mutations';
import { getBadge } from 'graphql/queries';
import { Event, Badge } from "models";
import { EditableSection, useCanEditSection } from "components/sectionEdit";
import { BsFiletypePdf } from "react-icons/bs";
import { MdClose } from "react-icons/md";

const client = generateClient();

const Dashboard = () => {
  const [event, setEvent] = React.useState([]);
  const id = useParams().id;
  const navigate = useNavigate();
  const canEdit = useCanEditSection("gafete");

  React.useEffect(() => {
    if (!id || id === "no-id") {
      navigate(`/admin/eventos`);
      return;
    }

    DataStore.query(Event, (e) => e.id.eq(id)).then((results) => {
      setEvent(results[0]);
      // Never store JSON.stringify(undefined) — it writes the literal string
      // "undefined", which crashes pages that JSON.parse this key.
      if (results[0]) {
        localStorage.setItem("EVENTFLOW.event", JSON.stringify(results[0]));
      }
    });
  }, [id, navigate]);

  // Cargar Badge existente si hay uno
  React.useEffect(() => {
    const loadExistingBadge = async () => {
      if (event && event.eventBadgeId) {
        setIsLoadingBadge(true);
        try {
          console.log("Cargando Badge existente...");

          const badgeResponse = await client.graphql({
            query: getBadge,
            variables: { id: event.eventBadgeId }
          });

          const badge = badgeResponse.data.getBadge;

          if (badge && badge.frontDesign && badge.backDesign) {
            console.log("Badge encontrado:", badge);
            setExistingBadge(badge);

            // Obtener URLs firmadas de S3 para mostrar preview
            const frontUrlResult = await getUrl({ key: badge.frontDesign });
            const backUrlResult = await getUrl({ key: badge.backDesign });

            setFrontPreviewUrl(frontUrlResult.url.toString());
            setBackPreviewUrl(backUrlResult.url.toString());

            console.log("URLs de preview cargadas");
          }
        } catch (error) {
          console.error("Error cargando Badge existente:", error);
        } finally {
          setIsLoadingBadge(false);
        }
      } else {
        setIsLoadingBadge(false);
      }
    };

    if (event) {
      loadExistingBadge();
    }
  }, [event]);

  /* Badge attachment logic */
  const [frontFile, setFrontFile] = useState(null);
  const [backFile, setBackFile] = useState(null);
  const [frontPreviewUrl, setFrontPreviewUrl] = useState(null);
  const [backPreviewUrl, setBackPreviewUrl] = useState(null);
  const [isDraggingFront, setIsDraggingFront] = useState(false);
  const [isDraggingBack, setIsDraggingBack] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingBadge, setIsLoadingBadge] = useState(false);
  const [existingBadge, setExistingBadge] = useState(null);

  const handleDragOver = (e, setIsDragging) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (setIsDragging) => {
    setIsDragging(false);
  };

  const handleDrop = (e, setFile, setIsDragging, setPreviewUrl) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === "application/pdf") {
      setFile(droppedFile);
      setPreviewUrl(null); // Limpiar preview de S3
    } else {
      alert("Solo se permiten archivos PDF.");
    }
  };

  const handleFileChange = (e, setFile, setPreviewUrl) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
      setPreviewUrl(null); // Limpiar preview de S3
    } else {
      alert("Solo se permiten archivos PDF.");
    }
  };

  const deleteFileFromS3 = async (key) => {
    try {
      if (key) {
        console.log("Eliminando archivo de S3:", key);
        await remove({ key });
        console.log("Archivo eliminado exitosamente");
      }
    } catch (error) {
      console.error('Error eliminando archivo:', error);
      // No lanzar error, continuar con la subida
    }
  };

  const uploadFileToS3 = async (file, key, oldKey = null) => {
    try {
      // Eliminar archivo antiguo si existe
      if (oldKey) {
        await deleteFileFromS3(oldKey);
      }

      console.log("Iniciando subida a S3:", { fileName: file.name, key });

      const uploadTask = uploadData({
        key: key,
        data: file,
        options: {
          contentType: file.type,
        }
      });

      const result = await uploadTask.result;
      console.log("Archivo subido exitosamente:", result);
      return result.key;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canEdit) return;
    console.log("handleSubmit iniciado");

    if (frontFile && backFile) {
      setIsLoading(true);
      try {
        console.log("Archivos seleccionados:", {
          front: frontFile.name,
          back: backFile.name
        });

        let badge;
        let oldFrontKey = null;
        let oldBackKey = null;

        // Verificar si el evento ya tiene un Badge
        if (event.eventBadgeId) {
          console.log("Evento tiene Badge existente, obteniendo...");

          // Obtener el Badge existente usando GraphQL
          const badgeResponse = await client.graphql({
            query: getBadge,
            variables: { id: event.eventBadgeId }
          });

          const existingBadge = badgeResponse.data.getBadge;

          if (existingBadge) {
            console.log("Badge encontrado:", existingBadge);
            oldFrontKey = existingBadge.frontDesign;
            oldBackKey = existingBadge.backDesign;

            // Subir archivos a S3 (eliminando los antiguos)
            const frontKey = `public/badges/${frontFile.name}`;
            const backKey = `public/badges/${backFile.name}`;

            const frontS3Key = await uploadFileToS3(frontFile, frontKey, oldFrontKey);
            const backS3Key = await uploadFileToS3(backFile, backKey, oldBackKey);

            console.log("Archivos subidos a S3:", { frontS3Key, backS3Key });

            // Actualizar Badge existente usando GraphQL
            const badgeUpdateInput = {
              id: existingBadge.id,
              frontDesign: frontS3Key,
              backDesign: backS3Key,
              _version: existingBadge._version
            };

            console.log("Actualizando Badge con input:", badgeUpdateInput);

            const updateResponse = await client.graphql({
              query: updateBadge,
              variables: { input: badgeUpdateInput }
            });

            badge = updateResponse.data.updateBadge;
            console.log("Badge actualizado:", badge);
          } else {
            // Si no existe, crear uno nuevo
            const frontKey = `public/badges/${frontFile.name}`;
            const backKey = `public/badges/${backFile.name}`;

            const frontS3Key = await uploadFileToS3(frontFile, frontKey);
            const backS3Key = await uploadFileToS3(backFile, backKey);

            const badgeInput = {
              frontDesign: frontS3Key,
              backDesign: backS3Key,
            };

            console.log("Creando nuevo Badge con input:", badgeInput);

            const badgeResponse = await client.graphql({
              query: createBadge,
              variables: { input: badgeInput }
            });

            badge = badgeResponse.data.createBadge;
            console.log("Badge creado:", badge);

            // Actualizar el Event con el nuevo Badge
            const eventUpdateInput = {
              id: event.id,
              eventBadgeId: badge.id,
              _version: event._version
            };

            await client.graphql({
              query: updateEvent,
              variables: { input: eventUpdateInput }
            });
          }
        } else {
          // Crear nuevo Badge usando GraphQL API directamente
          const frontKey = `public/badges/${frontFile.name}`;
          const backKey = `public/badges/${backFile.name}`;

          const frontS3Key = await uploadFileToS3(frontFile, frontKey);
          const backS3Key = await uploadFileToS3(backFile, backKey);

          console.log("Archivos subidos a S3:", { frontS3Key, backS3Key });

          const badgeInput = {
            frontDesign: frontS3Key,
            backDesign: backS3Key,
          };

          console.log("Creando Badge con input:", badgeInput);

          const badgeResponse = await client.graphql({
            query: createBadge,
            variables: { input: badgeInput }
          });

          badge = badgeResponse.data.createBadge;
          console.log("Badge creado con GraphQL:", badge);

          // Actualizar el Event con el nuevo Badge usando GraphQL
          const eventUpdateInput = {
            id: event.id,
            eventBadgeId: badge.id,
            _version: event._version
          };

          console.log("Actualizando Event con input:", eventUpdateInput);

          const eventResponse = await client.graphql({
            query: updateEvent,
            variables: { input: eventUpdateInput }
          });

          console.log("Event actualizado con Badge ID:", eventResponse.data.updateEvent);
        }

        // Esperar un momento para que DataStore sincronice
        await new Promise(resolve => setTimeout(resolve, 1000));

        alert("Gafetes guardados exitosamente");

        // Recargar el evento y el badge
        const updatedEvent = await DataStore.query(Event, event.id);
        setEvent(updatedEvent);

        // Limpiar archivos locales y recargar preview desde S3
        setFrontFile(null);
        setBackFile(null);

        // Recargar URLs de preview
        if (badge) {
          const frontUrlResult = await getUrl({ key: badge.frontDesign });
          const backUrlResult = await getUrl({ key: badge.backDesign });
          setFrontPreviewUrl(frontUrlResult.url.toString());
          setBackPreviewUrl(backUrlResult.url.toString());
        }

        console.log("Evento recargado:", updatedEvent);
      } catch (error) {
        console.error("Error al guardar los gafetes:", error);
        alert("Error al guardar los gafetes: " + error.message);
      } finally {
        setIsLoading(false);
      }
    } else {
      alert("Por favor, sube ambos archivos.");
    }
  };

  if (!event) {
    return <p>Loading...</p>;
  }

  return (
    <div className="event-detail-page">
      <div className="grid h-full">
        <Banner />
      </div>

      {event && event.length !== 0 && (
        <div className="!z-5 relative flex flex-col bg-white bg-clip-border shadow-card px-[14px] py-[20px] rounded-3xl sm:px-[14px] dark:!bg-navy-800 dark:text-white dark:shadow-none !z-5 overflow-hidden">

          {isLoadingBadge ? (
            <div className="flex flex-col items-center justify-center py-20">
              <span className="loader"></span>
              <h2 className="mb-2 text-center text-xl text-black dark:text-white">
                Cargando...
              </h2>
            </div>
          ) : (
            <EditableSection section="gafete">
            <form className="grid grid-cols-1 md:grid-cols-2 gap-6" onSubmit={handleSubmit}>
            {/* Campo de Drag and Drop para Front Design */}
            <div>
              <label className="block text-sm font-medium text-gray-900">Front Design (PDF)</label>
              <div
                onDragOver={(e) => handleDragOver(e, setIsDraggingFront)}
                onDragLeave={() => handleDragLeave(setIsDraggingFront)}
                onDrop={(e) => handleDrop(e, setFrontFile, setIsDraggingFront, setFrontPreviewUrl)}
                className={`mt-1 flex justify-center items-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md h-48 ${isDraggingFront ? 'border-indigo-500' : 'border-gray-300'}`}
              >
                <div className="space-y-1 text-center">
                  {frontFile ? (
                    <div className="flex items-center justify-center">
                      <BsFiletypePdf className="h-[35px] w-[35px] m-auto text-gray-500" />
                      <p className="ml-2 text-sm text-gray-500">{frontFile.name}</p>
                    </div>
                  ) : frontPreviewUrl ? (
                    <div className="flex flex-col items-center justify-center">
                      <BsFiletypePdf className="h-[35px] w-[35px] m-auto text-green-500" />
                      <p className="mt-2 text-sm text-green-600">Diseño cargado</p>
                      <p className="text-xs text-gray-500">Arrastra un nuevo archivo o haz clic para cambiar</p>
                    </div>
                  ) : (
                    <>
                      <BsFiletypePdf className="h-[35px] w-[35px] m-auto" />
                      <div className="flex text-sm text-gray-600">
                        <label
                          htmlFor="front-file-upload"
                          className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500"
                        >
                          <span>Sube un archivo</span>
                          <input
                            id="front-file-upload"
                            name="front-file-upload"
                            type="file"
                            accept=".pdf"
                            onChange={(e) => handleFileChange(e, setFrontFile, setFrontPreviewUrl)}
                            className="sr-only"
                          />
                        </label>
                        <p className="pl-1">o arrástralo aquí</p>
                      </div>
                      <p className="text-xs text-gray-500">PDF hasta 10MB</p>
                    </>
                  )}
                </div>
              </div>
              {/* Vista previa del archivo PDF */}
              {(frontFile || frontPreviewUrl) && (
                <div className="relative mt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setFrontFile(null);
                      setFrontPreviewUrl(null);
                    }}
                    className="absolute top-2 right-[10px] z-10 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg"
                    title="Cambiar archivo"
                  >
                    <MdClose className="h-5 w-5" />
                  </button>
                  <iframe
                    src={frontFile ? URL.createObjectURL(frontFile) : frontPreviewUrl}
                    className="w-full h-[600px] border"
                    title="Front Design Preview"
                  />
                </div>
              )}
            </div>

            {/* Campo de Drag and Drop para Back Design */}
            <div>
              <label className="block text-sm font-medium text-gray-900">Back Design (PDF)</label>
              <div
                onDragOver={(e) => handleDragOver(e, setIsDraggingBack)}
                onDragLeave={() => handleDragLeave(setIsDraggingBack)}
                onDrop={(e) => handleDrop(e, setBackFile, setIsDraggingBack, setBackPreviewUrl)}
                className={`mt-1 flex justify-center items-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md h-48 ${isDraggingBack ? 'border-indigo-500' : 'border-gray-300'}`}
              >
                <div className="space-y-1 text-center">
                  {backFile ? (
                    <div className="flex items-center justify-center">
                      <BsFiletypePdf className="h-[35px] w-[35px] m-auto text-gray-500" />
                      <p className="ml-2 text-sm text-gray-500">{backFile.name}</p>
                    </div>
                  ) : backPreviewUrl ? (
                    <div className="flex flex-col items-center justify-center">
                      <BsFiletypePdf className="h-[35px] w-[35px] m-auto text-green-500" />
                      <p className="mt-2 text-sm text-green-600">Diseño cargado</p>
                      <p className="text-xs text-gray-500">Arrastra un nuevo archivo o haz clic para cambiar</p>
                    </div>
                  ) : (
                    <>
                      <BsFiletypePdf className="h-[35px] w-[35px] m-auto" />
                      <div className="flex text-sm text-gray-600">
                        <label
                          htmlFor="back-file-upload"
                          className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500"
                        >
                          <span>Sube un archivo</span>
                          <input
                            id="back-file-upload"
                            name="back-file-upload"
                            type="file"
                            accept=".pdf"
                            onChange={(e) => handleFileChange(e, setBackFile, setBackPreviewUrl)}
                            className="sr-only"
                          />
                        </label>
                        <p className="pl-1">o arrástralo aquí</p>
                      </div>
                      <p className="text-xs text-gray-500">PDF hasta 10MB</p>
                    </>
                  )}
                </div>
              </div>
              {/* Vista previa del archivo PDF */}
              {(backFile || backPreviewUrl) && (
                <div className="relative mt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setBackFile(null);
                      setBackPreviewUrl(null);
                    }}
                    className="absolute top-2 right-[10px] z-10 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg"
                    title="Cambiar archivo"
                  >
                    <MdClose className="h-5 w-5" />
                  </button>
                  <iframe
                    src={backFile ? URL.createObjectURL(backFile) : backPreviewUrl}
                    className="w-full h-[600px] border"
                    title="Back Design Preview"
                  />
                </div>
              )}
            </div>

            {/* Botón para guardar */}
            <div className="col-span-2 flex justify-end">
              <button
                type="submit"
                disabled={isLoading}
                className={`mt-4 px-4 py-2 text-white text-sm font-medium rounded-md focus:outline-none flex items-center gap-2 ${
                  isLoading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-brand-500 hover:bg-black hover:text-white'
                }`}
              >
                {isLoading && (
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {isLoading ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
            </EditableSection>
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
