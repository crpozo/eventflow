import React, { useState, useEffect, useRef } from "react";
import * as XLSX from "xlsx";
import { Button } from "@chakra-ui/button";
import { DataStore } from "aws-amplify/datastore";
import { Attendee, EventAttendee } from "models";

export default function UploadExcelButton() {
  const url = window.location.href;
  const requiredColumns = [
    "identificacion",
    "email",
    "nombre y apellido",
    "direccion",
    "telefono",
  ];
  const domain = url.split("/")[2]; // The event ID is the 5th segment
  const eventID = url.split("/")[5]; // The event ID is the 5th segment
  const [isPending, setIsPending] = useState(false);

  //   const [eventAttendees, setEventAttendees] = useState([]);

  //   useEffect(() => {
  //     const fetchData = async () => {
  //       try {
  //         const attendees = await DataStore.query(EventAttendee, (e) => e.eventID.eq(eventID));
  //         setEventAttendees(attendees); // Store the fetched event attendees in the state
  //         alert(JSON.stringify(attendees,null,2));
  //       } catch (error) {
  //         console.error("Error fetching event attendees: ", error);
  //       }
  //     };

  //     if (eventID) {
  //       fetchData();
  //     }
  //   }, [eventID]);

  const fileInputRef = useRef(null);

  const handleButtonClick = () => {
    fileInputRef.current.click();
  };

  async function createAttendee() {
    return await DataStore.save(new Attendee({}));
  }

  const handleFileChange = async (event) => {
    try {
      const file = event.target.files[0];

      if (!file) return;

      setIsPending(true);

      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: "array" });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          let participants = XLSX.utils.sheet_to_json(worksheet);

          // Convert all keys to lowercase and return the new object
          participants = participants.map((row) => {
            return Object.fromEntries(
              Object.entries(row).map(([key, value]) => [
                key.toLowerCase(),
                value,
              ])
            );
          });

          // Check if all required columns are present
          const header = Object.keys(participants[0]);

          const hasAllRequiredColumns = requiredColumns.every((col) => {
            const result = header.includes(col);
            return result;
          });

          if (!hasAllRequiredColumns) {
            const missingColumns = requiredColumns.filter(
              (col) => !header.includes(col)
            );
            alert("Missing columns: " + missingColumns.join(", "));
            throw new Error("Missing required columns");
          }

          console.log(participants);

          for (const participant of participants) {
            const attendee = await createAttendee();

            if (attendee) {
              try {
                const newEventAttendee = await DataStore.save(
                  new EventAttendee({
                    eventID: eventID,
                    attendeeID: attendee.id,
                    authorized: false,
                    checkIn: false,
                    formAnswers: JSON.stringify(participant),
                    ticket: ``,
                    email: participant.email,
                    allowContact: false,
                    quantity: 0,
                    scanned: 0,
                    profileURL: `${domain}/usuario/${attendee.id}`,
                  })
                );
                console.log(
                  "Added successfully: " +
                    JSON.stringify(newEventAttendee, null, 2)
                );
              } catch (error) {
                console.error("Error saving EventAttendee:", error);
              }
            }
          }
        } catch (err) {
          console.error("Error processing file:", err);
          console.log("There was an error processing the file.");
        } finally {
          setIsPending(false);
        }
      };

      reader.onerror = (error) => {
        console.error("Error reading file:", error);
        setIsPending(false);
      };

      reader.readAsArrayBuffer(file);
    } catch (err) {
      console.error("Error handling file upload:", err);
      console.log("Error handling file upload.");
      setIsPending(false);
    }
  };

  return (
    <div>
      <Button
        colorScheme="red"
        className="rounded-xl bg-brand-500 px-4 py-2 text-white hover:bg-red-700 border-0 "
        onClick={handleButtonClick}
        disabled={isPending}
      >
        {isPending ? "Uploading... " : "Upload File"}
      </Button>

      <input
        type="file"
        ref={fileInputRef}
        accept=".xlsx, .csv, .xls"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
    </div>
  );
}
