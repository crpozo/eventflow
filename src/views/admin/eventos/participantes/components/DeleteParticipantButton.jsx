import React, { useState } from 'react';
import { MdDelete } from 'react-icons/md';
import { DataStore } from 'aws-amplify/datastore';
import { EventAttendee, Attendee } from 'models';

const DeleteParticipantButton = ({ eventAttendee, onDeleted }) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    // Confirm deletion
    const confirmDelete = window.confirm(
      `¿Estás seguro de eliminar al participante con email: ${eventAttendee.email}?\n\nEsta acción no se puede deshacer.`
    );

    if (!confirmDelete) {
      return;
    }

    setIsDeleting(true);

    try {
      // Delete EventAttendee first
      const eventAttendeeToDelete = await DataStore.query(EventAttendee, eventAttendee.id);
      if (eventAttendeeToDelete) {
        await DataStore.delete(eventAttendeeToDelete);
      }

      // Delete associated Attendee
      if (eventAttendee.attendeeID) {
        const attendeeToDelete = await DataStore.query(Attendee, eventAttendee.attendeeID);
        if (attendeeToDelete) {
          await DataStore.delete(attendeeToDelete);
        }
      }

      // Callback to notify parent component
      if (onDeleted) {
        onDeleted(eventAttendee.id);
      }

    } catch (error) {
      alert('Error al eliminar el participante: ' + error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className={`p-2 rounded-md transition-colors ${
        isDeleting
          ? 'bg-gray-200 cursor-not-allowed text-gray-400'
          : 'text-black hover:text-brand-500'
      }`}
      title="Eliminar Participante"
    >
      {isDeleting ? (
        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : (
        <MdDelete className="h-5 w-5" />
      )}
    </button>
  );
};

export default DeleteParticipantButton;
