import { v4 as uuidv4 } from "uuid";

const DEFAULT_SOURCE = "urn:com:medicrea:via:orchestrator";
const DEFAULT_SPECVERSION = "1.0.1";
const DEFAULT_CONTENT_TYPE = "application/json";

export interface OrchestratorCloudEventParams {
  source?: string;
  specversion?: string;
  type: string;
  datacontenttype?: string;
  data?: unknown;
}

export default class OrchestratorCloudEvent {
  id: string;
  source: string;
  specversion: string;
  type: string;
  time: string;
  datacontenttype: string;
  data: unknown;

  constructor(params: OrchestratorCloudEventParams) {
    const { source, specversion, datacontenttype, type, data } = params;
    this.id = uuidv4();
    this.time = new Date().toISOString();
    this.type = type;
    this.source = source || DEFAULT_SOURCE;
    this.specversion = specversion || DEFAULT_SPECVERSION;
    this.datacontenttype = datacontenttype || DEFAULT_CONTENT_TYPE;
    this.data = data || {};
  }
}
