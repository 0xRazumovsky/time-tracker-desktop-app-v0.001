import pino from "pino";

const level = process.env.LOG_LEVEL;
const options = { level };
options.transport = {
  target: "pino-pretty",
  options: {
    colorize: true,
    translateTime: "SYS:standard",
  },
};

export const logger = pino(options);
export default logger;
