class Config {
  static instance = null;

  constructor(url, storage = sessionStorage) {
    if (Config.instance) {
      throw new Error('Config instance already exists. Use getInstance() instead.');
    }

    this._configUrl = url;
    this._storage = storage;
    this._initialized = false;

    Config.instance = this;
  }

  async initialize() {
    if (this._initialized) return;

    try {
      const storedData = this._storage.getItem("configData");
      if (storedData) {
        this._setConfigData(JSON.parse(storedData));
        console.log("Config loaded from cached data.");
        console.log(storedData);
      } else {
        console.log("fetching config from " + this._configUrl);

        const response = await fetch(this._configUrl);
        console.log(response);

        if (!response.ok) throw new Error(`Failed to load config: ${response.statusText}`);

        console.log("response is ok !!!!!!!!!!!!!!!!!!!!!!!");

        const data = await response.json();
        this._setConfigData(data);
        console.log(`Config loaded from ${this._configUrl}`);
        console.log(data);
        this._storage.setItem("configData", JSON.stringify(data));
      }

      this._initialized = true;
    } catch (error) {
      throw new Error(`Error loading config: ${error.message}`);
    }
  }

  _setConfigData(data) {
    for (const [key, value] of Object.entries(data)) {
      if (!(key in Object.getPrototypeOf(this)) && !key.startsWith("_")) {
        this[key] = value;
      } else {
        console.warn(`Skipping config property "${key}" as it conflicts with internal properties.`);
        throw new Error(`Error, config property "${key}" conflicts with internal property.`);
      }
    }
  }

  get(prop) {
    return this[prop];
  }

  static getInstance(url, storage) {
    return Config.instance || new Config(url, storage);
  }

  static clearStorage() {
    if (Config.instance?._storage) {
      Config.instance._storage.removeItem("configData");
    }
    Config.instance = null;
  }
}

export { Config };
