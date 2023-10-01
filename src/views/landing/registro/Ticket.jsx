import React from "react";
import logo from "assets/img/usfq/logo.svg";
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";
import QRCode from "qrcode";

const Ticket = ({ props, userData, eventID }) => {
  // Generate QR code data URL
  // const generateQRCode = async () => {
  //   try {
  //     const qrDataURL = await QRCode.toDataURL(eventID);
  //     return qrDataURL;
  //   } catch (error) {
  //     console.error("Error generating QR code:", error);
  //     return null;
  //   }
  // };

  // // Convert QR code data URL to base64
  // const qrCodeBase64 = generateQRCode().replace("data:image/png;base64,", "");

  return (
    <Document>
      <Page size="A4">
        <View style={styles.container}>
          <Image
            style={styles.logo}
            src={`http://localhost:3000/assets/img/usfq/logo.svg`}
          />
          <Text style={styles.title}>{props.landing.title}</Text>
          {/* Render the QR code as an Image */}
          {/* <Image
            src={`data:image/png;base64,${qrCodeBase64}`}
            style={styles.qrcode}
          /> */}
          {/* Map userData to Text components */}
          {userData.map((data, i) => (
            <View key={i}>
              {data.name === "text-1692266990765-0" && (
                <Text style={styles.userDataText}>{data.userData[0]}</Text>
              )}
              {data.name === "text-1692267033618-0" && (
                <Text style={styles.userDataText}>{data.userData[0]}</Text>
              )}
              {data.name === "text-1692267060603-0" && (
                <Text style={styles.userDataText}>{data.userData[0]}</Text>
              )}
            </View>
          ))}
          <Text style={styles.dateTime}>
            Viernes, Junio 16/06/2023 - 18:00pm
          </Text>
          <Text style={styles.location}>
            Universidad San Francisco de Quito, Campus Cumbayá
          </Text>
        </View>
      </Page>
    </Document>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid gray",
    padding: 30,
    width: 350, // Adjust as needed
    margin: "auto",
  },
  logo: {
    marginBottom: 16,
    width: 150,
  },
  title: {
    marginBottom: 16,
    fontSize: 20,
    fontWeight: "bold",
  },
  qrcode: {
    marginBottom: 40,
  },
  userDataText: {
    marginBottom: 8,
    fontSize: 16,
  },
  dateTime: {
    marginBottom: 8,
    fontSize: 16,
  },
  location: {
    marginBottom: 8,
    fontSize: 16,
    textAlign: "justify",
  },
});

export default Ticket;
