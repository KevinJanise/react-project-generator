import { useState, useEffect, useCallback, useMemo } from "react";

function updateNestedProperty(obj, path, value) {
  const keys = path.replace(/\[(\d+)\]/g, ".$1").split(".");
  let current = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];

    if (!(key in current) || current[key] === null) {
      current[key] = isNaN(Number(keys[i + 1])) ? {} : [];
    }

    current = current[key];
  }

  current[keys[keys.length - 1]] = value;
}

function useForm(getInitialState) {
  const [initialState, setInitialState] = useState(() =>
    typeof getInitialState === "function" ? getInitialState() : getInitialState
  );
  const [formData, setFormData] = useState(initialState);

  useEffect(() => {
    setFormData(initialState);
  }, [initialState]);

  const updateInitialState = useCallback((newInitialState) => {
    setInitialState(newInitialState);
  }, []);

  const updateFormData = useCallback((name, value) => {
    setFormData((prevState) => {
      const newState = { ...prevState };
      updateNestedProperty(newState, name, value);
      return newState;
    });
  }, []);

  const handleChange = useCallback((e) => {
    const { name, value, type, checked, files, multiple, options } = e.target;

    setFormData((prevState) => {
      const newState = { ...prevState };

      switch (type) {
        case "checkbox": {
          const checkboxOptions = e.target.dataset?.checkboxValues
            ? JSON.parse(e.target.dataset.checkboxValues)
            : null;

          if (checkboxOptions) {
            const [checkedValue, uncheckedValue] = checkboxOptions;
            updateNestedProperty(newState, name, checked ? checkedValue : uncheckedValue);
          } else if (Array.isArray(prevState[name])) {
            updateNestedProperty(
              newState,
              name,
              checked ? [...prevState[name], value] : prevState[name].filter((item) => item !== value)
            );
          } else {
            updateNestedProperty(newState, name, checked);
          }
          break;
        }
        case "file": {
          updateNestedProperty(newState, name, files);
          break;
        }
        case "radio": {
          if (checked) {
            updateNestedProperty(newState, name, value);
          }
          break;
        }
        default: {
          if (multiple && options) {
            const selectedValues = Array.from(options)
              .filter((option) => option.selected)
              .map((option) => option.value);
            updateNestedProperty(newState, name, selectedValues);
          } else {
            updateNestedProperty(newState, name, value);
          }
        }
      }

      return newState;
    });
  }, []);

  const handleBlur = useCallback((e, transformFn) => {
    const { name, value } = e.target;
    if (typeof transformFn === "function") {
      const transformedValue = transformFn(value);
      updateFormData(name, transformedValue);
    }
  }, [updateFormData]);

  const trimValue = useCallback((e) => {
    const { name, value } = e.target;
    const trimmedValue = typeof value === 'string' ? value.trim() : value;
    updateFormData(name, trimmedValue);
  }, [updateFormData]);
  
  const handleMagneticChange = useCallback(
    (name, type, staticValue) => (value) => {
      const finalValue = staticValue !== undefined ? staticValue : value;
      const target = { name, type: type || "text", value: finalValue };

      switch (type) {
        case "radio":
        case "checkbox":
          target.checked = value;
          break;
        default:
        // do nothing
      }

      handleChange({ target });
    },
    [handleChange]
  );

  const resetForm = useCallback(() => {
    setFormData(initialState);
  }, [initialState]);

  return useMemo(
    () => ({
      formData,
      handleChange,
      handleBlur,
      updateFormData,
      resetForm,
      handleMagneticChange,
      setFormData,
      updateInitialState,
      trimValue
    }),
    [formData, handleChange, handleBlur, updateFormData, resetForm, handleMagneticChange, updateInitialState, trimValue]
  );
}

export { useForm };
