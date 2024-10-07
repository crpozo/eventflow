import React, { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { Button } from "@chakra-ui/button";
import { DataStore } from "aws-amplify/datastore";
import { Attendee, EventAttendee, Form } from "models";

export default function UploadExcelButton() {
  const url = window.location.href;
  const domain = url.split("/")[2]; // The event ID is the 5th segment
  const eventID = url.split("/")[5]; // The event ID is the 5th segment
  const [isPending, setIsPending] = useState(false);

  const fileInputRef = useRef(null);

  const handleButtonClick = async () => {
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

          const questions= (await DataStore.query(Form, (f) => f.formEventId.eq(eventID)))[0]?.questions;    

          for (const participant of participants) {
            const attendee = await createAttendee();
            const answers=questions.map((q)=>({...q,userData:[participant[q.name.toLowerCase()]??'']}));
            if (attendee) {
              try {
                const newEventAttendee = await DataStore.save(
                  new EventAttendee({
                    eventID: eventID,
                    attendeeID: attendee.id,
                    authorized: false,
                    checkIn: false,
                    formAnswers: JSON.stringify(answers),
                    ticket: ``,
                    email: participant.email,
                    allowContact: false,
                    quantity: 1,
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
        hidden
        onChange={handleFileChange}
      />
    </div>
  );
}
