export function isEmpty(value, trimValue = false) {
  if (isUndefinedOrNull(value) || value === "" || value.length === 0 || Object.keys(value).length === 0) {
    return true;
  }

  if (trimValue === true) {
    return value.trim() === "";
  }

  return false;
}

// Validates a date is in the form MM/DD/YYYY or MM-DD-YYYY
export function isDate(value) {
  const dateRegex = /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/;
  const matches = dateRegex.exec(value);

  if (!matches) {
    return false; // Invalid format
  }

  let dateObject = new Date(value);

  return !isNaN(dateObject) && dateObject.toString() !== "Invalid Date";
}

export function isNotEmpty(value) {
  return !isEmpty(value);
}

export function trimmedLength(value) {
  return value.trim().length;
}

export function isUndefined(variable) {
  return typeof variable === "undefined";
}

export function isUndefinedOrNull(variable) {
  return typeof variable === "undefined" || variable === null;
}

export function matchesRegularExpression(regularExpression, value) {
  let regEx = new RegExp(regularExpression);

  return regEx.test(value);
}

export function isEmailAddress(emailAddress) {
  if (isUndefinedOrNull(emailAddress)) return false;

  const regex = /^[a-zA-Z0-9.+_-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  return regex.test(emailAddress);
}

// handles (###) ###-#### or ########## or ### ### #### or ###-###-####
export function isTelephoneNumber(telephoneNumber) {
  if (isUndefinedOrNull(telephoneNumber)) return false;

  const phoneRegex = /^(\(\d{3}\) ?|\d{3}-|\d{3} ?-?)\d{3}-?\d{4}$/;
  return phoneRegex.test(telephoneNumber);
}

export function isNumeric(str) {
  if (isUndefinedOrNull(str)) return false;

  const regex = /^\d+$/;
  return regex.test(str);
}


export function isURL(str) {
  try {
    new URL(str);
  } catch (error) {
    return false;
  }

  return true;
}

export function hasValueInObjectsORIG(objectArray, value, propName) {
  // Iterate through the array of objects
  for (const obj of objectArray) {
    // Check if the object has the specified property and if its value matches
    if (obj.hasOwnProperty(propName) && obj[propName] === value) {
      return true; // Value found in one of the objects
    }
  }
  // Value not found in any of the objects
  return false;
}

// returns the index of the item with the matching value in the property
export function hasValueInObjects(objectArray, value, propName) {
  // Iterate through the array of objects
  let obj = null;

  for (let i = 0; i < objectArray.length; ++i) {
    obj = objectArray[i];

    if (obj.hasOwnProperty(propName) && obj[propName] === value) {
      return i;
    }
  }

  // Value not found in any of the objects
  return -1;
}


export function hasValidCharacters(value, validChars) {
  // Check if each character in value is present in validChars
  for (const element of value) {
    if (validChars.indexOf(element) === -1) {
      return false;
    }
  }

  return true;
}

// formats: 5 digits, 9 digits, or 12345-1234
export function isZipCode(zipCode) {
    // Regular expression for US ZIP code validation
    const zipCodeRegex = /^(\d{5}(-\d{4})?|\d{9})$/;
  
    // Test the input against the regex
    if (zipCodeRegex.test(zipCode)) {
      return true;
    } else {
      return false;
    }
  }
 