import axios from "axios";

export async function getAddressFromCoordinates(
  lat: number,
  long: number,
): Promise<string> {
  try {
    const response = await axios.get(
      `https://nominatim.openstreetmap.org/reverse`,
      {
        params: {
          lat,
          lon: long,
          format: "json",
          "accept-language": "en",
        },
        headers: {
          "User-Agent": "MyCookingApp/1.0 (ahmedmihad962@gmail.com)", // ← Change this
        },
      },
    );
    console.log(response.data.address);
    const address = `${response.data.address?.road}, ${response.data.address?.suburb}, ${response.data.address?.city}-${response.data.address?.postcode}, ${response.data.address?.country}`;
    return address || "Address not found";
  } catch (error) {
    console.error("Geocoding error:", error);
    return "Error fetching address";
  }
}
