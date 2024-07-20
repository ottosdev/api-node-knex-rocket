import fastify from 'fastify';
import {env} from "./env";
import {transactionsRouter} from "./routes/transactions";
import fastifyCookie from "@fastify/cookie";

export const app = fastify();

app.register(fastifyCookie);
app.register(transactionsRouter, {
    prefix: '/transactions'
});
