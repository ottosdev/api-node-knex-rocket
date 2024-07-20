import {afterAll, beforeAll, expect, describe, it, beforeEach, afterEach} from 'vitest';
import supertest from "supertest";
import {app} from "../app";
import {execSync} from "node:child_process";
describe('Transactions Routes', () => {
    beforeAll(async () => {
        await app.ready();
    });

    afterAll(async args => {
        await app.close();
    })

    beforeEach(() => {
        try {
            execSync('npm run knex migrate:rollback --all');
            execSync('npm run knex migrate:latest');
        } catch (error) {
            console.error("Erro ao realizar rollback ou aplicar migrações:", error);
        }
    });

    it('O usuario consegue criar uma nova transacao', async () => {

        const response = await supertest(app.server).post('/transactions').send({
            title: 'Salario',
            amount: 3000,
            type: 'credit'
        })

        expect(response.status).toBe(201);
    });

    it('O usuario consegue listar todas as transacoes', async () => {
        const createTransactionResponse = await supertest(app.server)
            .post('/transactions')
            .send({
            title: 'Salario',
            amount: 3000,
            type: 'credit'
        })

        const cookies = createTransactionResponse.get('Set-Cookie');

        if (cookies) {
            const listTransactionResponse = await supertest(app.server)
                .get('/transactions')
                .set('Cookie', cookies).expect(200);


            expect(listTransactionResponse.body).toEqual([
               expect.objectContaining({
                   title: 'Salario',
                   amount: 3000,
               })
            ])
        }
    })
})
