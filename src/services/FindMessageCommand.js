import { Command } from "./Command";
import { Config } from "hooks/config";
import * as Utils from "utils/Utils";

class FindMessageCommand extends Command {
  static OPERATION = "FIND_MESSAGE";

  constructor(searchCriteria, options = {}) {
    const config = Config.getInstance();
    let url = null;
    let endpoint = "/dist/findMessage.json";

    url = `${config.serviceUrl}${endpoint}`;

    super(url);

    this.searchCriteria = searchCriteria;
  }

  prepareSearchParams() {
    let searchParams = {};

    searchParams = {...this.searchCriteria};

    return searchParams;
  }

  processSearchResults(results) {
    return results;
  }

  async execute() {
    try {
      await Utils.pause(3000);

      let searchParams = this.prepareSearchParams();

      console.log(searchParams);

      // searchParams will be translated into query parameters
      let result = await this.get();
      console.log("result", result);
      let processedResults = this.processSearchResults(result);

      return processedResults;
    } catch (error) {
      if (error?.response?.status === 404) {
        console.log("404 error", error.response);

        return {};
      }

      throw error;
    }
  }
}

export { FindMessageCommand };

