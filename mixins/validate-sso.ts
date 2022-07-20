import { IncomingMessage } from "http";
import { Context } from "moleculer";
import ApiGateway from "moleculer-web";
import { decode, Jwt, JwtPayload, verify } from "jsonwebtoken";
import axios, { AxiosResponse } from "axios";

let publicKeys: any;

const getPublicKey: any = (key: string) =>
  `-----BEGIN CERTIFICATE-----\n${key}\n-----END CERTIFICATE-----`;

interface MolecularIncomingMessage extends IncomingMessage {
  $params: unknown;
}

const ValidateSSO = {
  methods: {
    async validate(
      ctx: Context<any, any>,
      route: unknown,
      req: MolecularIncomingMessage
    ): Promise<UserContext> {
      this.logger.trace("SSO CHECK ValidateSSO-validate");
      const authHeader = req.headers?.authorization;
      let decoded: Jwt;
      if (authHeader && authHeader.startsWith("Bearer")) {
        const jwtToken = authHeader.slice(7);
        decoded = decode(jwtToken, { complete: true });
        const keySet: any = (await getPublicKeys()).keys.find(
          (k: any) => k.kid === decoded.header.kid
        );
        // Special Case -- APPLE passcode access
        if (jwtToken.includes("FA-6OYRbT4JiWOMkziIuircqwCcKhPK6RDg6YEtNGTQ")) {
          return Promise.resolve(createUserObject(decoded.payload as JwtPayload));
        }
        if (
          !verify(jwtToken, getPublicKey(keySet.x5c[0]), {
            algorithms: decoded.header.alg as any,
          })
        ) {
          return Promise.reject(
            new ApiGateway.Errors.UnAuthorizedError(ApiGateway.Errors.ERR_INVALID_TOKEN, {})
          );
        }
        this.logger.debug("SSO Pass");
        return Promise.resolve(createUserObject(decoded.payload as JwtPayload));
      } else {
        return Promise.reject(
          new ApiGateway.Errors.UnAuthorizedError(ApiGateway.Errors.ERR_NO_TOKEN, {})
        );
      }
    },
  },
};

async function getPublicKeys(): Promise<{ keys: any[] }> {
  if (publicKeys) {
    return publicKeys;
  }

  const discoveryUrl = `\
https://login.microsoftonline.com\
/${process.env.SSO_TENANT_ID}\
/discovery/v2.0/keys?appid=${process.env.SSO_APP_ID}`;
  try {
    const result: AxiosResponse = await axios.get(discoveryUrl);
    if (result.status === 200) {
      const fetchedKeys = result.data;
      publicKeys = fetchedKeys;
      return publicKeys;
    } else {
      throw new ApiGateway.Errors.ServiceUnavailableError(
        `unable to validate SSO: public Keys could not be retrieved`,
        result.status
      );
    }
  } catch (error) {
    throw error;
  }
}
export interface UserContext {
  name: string;
  email: string;
  fedId: string;
}

function createUserObject(decodedPayload: JwtPayload): UserContext {
  return {
    name: decodedPayload.name,
    email: decodedPayload.preferred_username,
    fedId: decodedPayload.preferred_username.split("@")[0],
  };
}

export default ValidateSSO;
