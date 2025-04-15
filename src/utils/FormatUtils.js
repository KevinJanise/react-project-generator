export function formatTimeToLocalAmPm(startTimeString) {
  try {
    const startTime = new Date(startTimeString);

    const month = startTime.getMonth() + 1; // Month is 0-indexed
    const day = startTime.getDate();
    const year = startTime.getFullYear();

    let hours = startTime.getHours();
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12; // Handle midnight

    const minutes = startTime.getMinutes();
    const formattedMinutes = minutes < 10 ? "0" + minutes : minutes;

    return `${month}/${day}/${year} ${hours}:${formattedMinutes}${ampm}`;
  } catch (error) {
    console.error("Error parsing or formatting date:", error);
    return "Invalid Date";
  }
}

export function toLowerFirstLetter(str) {
  if (!str) {
    return ""; // Handle empty or null strings
  }
  return str.charAt(0).toLowerCase() + str.slice(1);
}

export function toUpperFirstLetter(str) {
  if (!str) {
    return ""; // Handle empty or null strings
  }
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function toKebabCase(name) {
  return name
    .replace(/([a-z])([A-Z])/g, '$1-$2') // insert dash between camelCase transitions
    .replace(/[\s_]+/g, '-')             // replace spaces/underscores with dash
    .toLowerCase();                      // convert to lowercase
}