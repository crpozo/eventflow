import React, { useState } from 'react';
import { useNavigate, useParams } from "react-router-dom";
import Banner from "./components/Banner";
import { DataStore } from 'aws-amplify/datastore';
import { Event } from "models";
import { MdEditCalendar } from "react-icons/md";
import { BsFiletypePdf } from "react-icons/bs";

const Dashboard = () => {
  const [event, setEvent] = React.useState([]);
  const id = useParams().id;
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!id || id === "no-id") {
      navigate(`/admin/eventos`);
      return;
    }

    DataStore.query(Event, (e) => e.id.eq(id)).then((results) => {
      setEvent(results[0]);
      localStorage.setItem("EVENTFLOW.event", JSON.stringify(results[0]));
    });
  }, [id, navigate]);

  /* Badge attachment logic */
  const [frontFile, setFrontFile] = useState(null);
  const [backFile, setBackFile] = useState(null);
  const [isDraggingFront, setIsDraggingFront] = useState(false);
  const [isDraggingBack, setIsDraggingBack] = useState(false);

  const handleDragOver = (e, setIsDragging) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (setIsDragging) => {
    setIsDragging(false);
  };

  const handleDrop = (e, setFile, setIsDragging) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile.type === "application/pdf") {
      setFile(droppedFile);
    } else {
      alert("Solo se permiten archivos PDF.");
    }
  };

  const handleFileChange = (e, setFile) => {
    const selectedFile = e.target.files[0];
    if (selectedFile.type === "application/pdf") {
      setFile(selectedFile);
    } else {
      alert("Solo se permiten archivos PDF.");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (frontFile && backFile) {
      // Lógica para guardar la información
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

          <form className="grid grid-cols-1 md:grid-cols-2 gap-6" onSubmit={handleSubmit}>
            {/* Campo de Drag and Drop para Front Design */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Front Design (PDF)</label>
              <div
                onDragOver={(e) => handleDragOver(e, setIsDraggingFront)}
                onDragLeave={() => handleDragLeave(setIsDraggingFront)}
                onDrop={(e) => handleDrop(e, setFrontFile, setIsDraggingFront)}
                className={`mt-1 flex justify-center items-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md h-48 ${isDraggingFront ? 'border-indigo-500' : 'border-gray-300'}`}
              >
                <div className="space-y-1 text-center">
                  {frontFile ? (
                    <div className="flex items-center justify-center">
                      <BsFiletypePdf className="h-[35px] w-[35px] m-auto text-gray-500" />
                      <p className="ml-2 text-sm text-gray-500">{frontFile.name}</p>
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
                            onChange={(e) => handleFileChange(e, setFrontFile)}
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
              {frontFile && (
                <iframe
                  src={URL.createObjectURL(frontFile)}
                  className="w-full h-[600px] mt-4 border"
                  title="Front Design Preview"
                />
              )}
            </div>

            {/* Campo de Drag and Drop para Back Design */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Back Design (PDF)</label>
              <div
                onDragOver={(e) => handleDragOver(e, setIsDraggingBack)}
                onDragLeave={() => handleDragLeave(setIsDraggingBack)}
                onDrop={(e) => handleDrop(e, setBackFile, setIsDraggingBack)}
                className={`mt-1 flex justify-center items-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md h-48 ${isDraggingBack ? 'border-indigo-500' : 'border-gray-300'}`}
              >
                <div className="space-y-1 text-center">
                  {backFile ? (
                    <div className="flex items-center justify-center">
                      <BsFiletypePdf className="h-[35px] w-[35px] m-auto text-gray-500" />
                      <p className="ml-2 text-sm text-gray-500">{backFile.name}</p>
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
                            onChange={(e) => handleFileChange(e, setBackFile)}
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
              {backFile && (
                <iframe
                  src={URL.createObjectURL(backFile)}
                  className="w-full h-[600px] mt-4 border"
                  title="Back Design Preview"
                />
              )}
            </div>

            {/* Botón para guardar */}
            <div className="col-span-2 flex justify-end">
              <button
                type="submit"
                className="mt-4 px-4 py-2 bg-brand-500 text-white text-sm font-medium rounded-md hover:bg-black hover:text-white focus:outline-none"
              >
                Guardar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
