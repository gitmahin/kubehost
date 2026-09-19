import { Container } from "inversify";
import { ApiRouter } from "./routes";


export const container = new Container();
container.bind(ApiRouter).toSelf().inSingletonScope();
