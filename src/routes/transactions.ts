import {FastifyInstance} from "fastify";
import {z} from "zod";
import {knex} from "../db";
import {checkSessionIdExists} from "../middleware/check-session-id-exists";

export async function transactionsRouter(app: FastifyInstance) {
    // app.addHook('preHandler', checkSessionIdExists);
    app.post('/', async (request, response) => {
        const createTransactionSchema = z.object({
            title: z.string(),
            amount: z.number(),
            type: z.enum(['credit', 'debit'])
        });

        const body = createTransactionSchema.parse(request.body);

        let sessionId = request.cookies.sessionId;

        if(!sessionId) {
            sessionId = crypto.randomUUID();
            response.setCookie('sessionId', sessionId, {
                path: '/',
                maxAge: 60 * 60 * 24 * 7 // 7 dias
            });
        }

        await knex('transactions').insert({
            id: crypto.randomUUID(),
            title: body.title,
            amount: body.type === 'credit' ? body.amount : body.amount * -1,
            session_id: sessionId
        });

        return response.status(201).send();
    });

    app.get('/', {preHandler: [checkSessionIdExists]} ,async (request, response) => {
        const sessionId = request.cookies.sessionId;
        const {title, amount} = request.query as any;

        let query = knex('transactions').select('*').where({ session_id: sessionId });

        if (title) {
            query = query.andWhere('title', title);
        }

        if (amount) {
            query = query.andWhere('amount', amount);
        }

        const transactions = await query;

        return response.status(200).send(transactions);
    })

    app.get('/:id',  {preHandler: [checkSessionIdExists]} ,async (request, response) => {
        const paramsSchema = z.object({
            id: z.string().uuid()
        })

        const sessionId = request.cookies.sessionId;

        const {id} = paramsSchema.parse(request.params);
        const transaction = await knex('transactions')
            .where({
                id: id,
                session_id: sessionId
            })
            .first();
        if (!transaction) {
            return response.status(404).send();
        }
        return response.status(200).send(transaction);
    })

    app.get('/summary', {preHandler: [checkSessionIdExists]},async (request, response) => {
        const sessionId = request.cookies.sessionId;
        const summary = await knex('transactions')
            .sum('amount', {as: 'amount'}).where('session_id', sessionId).first();

        return {
            summary
        }
    })
}


