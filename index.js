import { Handlers, Integrations, init } from '@sentry/node'
import "@sentry/tracing";
import {ProfilingIntegration} from "@sentry/profiling-node";
import { getGrades, getStudentData, login, logout } from './components/utils.js' // Utilitys/API functions

import express from 'express' // expressJS
import './components/logger.js' // Set up default logger
import winston from 'winston'

const app = express() // Initialize express app

// Initialize sentry
init({
    dsn: process.env.SENTRY_DSN,
    integrations: [
        // HTTP calls tracing
        new Integrations.Http({ tracing: true }),
        // express.js middleware tracing
        new Integrations.Express({ app }),
        // profiling integration
        new ProfilingIntegration()
    ],
    tracesSampleRate: process.env.SENTRY_TRACESAMPLERATE,
    profilesSampleRate: process.env.SENTRY_TRACEPROFILERATE,
})
// Add some sentry middleware
app.use(Handlers.requestHandler());
app.use(Handlers.tracingHandler());

// API endpoints
app
    .post('/auth/login', (req, res) => {

        // Check to make sure a username and password is present. If either one is missing, return with an error.
        if (!req.headers.username) {
            res.status(400).send({
                status: "failed",
                error: "Username missing."
            });
            return;
        } else if (!req.headers.password) {
            res.status(400).send({
                status: "failed",
                error: "Password missing."
            });
            return;
        }
        login(req.headers.username, req.headers.password, res);

    })
    .get('/student/getDetails', (req, res) => {

        if (!req.headers.accesstoken) {
            res.status(400).send({
                status: "failed",
                error: "accessToken missing."
            });
            return;
        } else getStudentData(req.headers.accesstoken, res);
    })
    .get('/student/getGrades', (req, res) => {

        if (!req.headers.accesstoken) {
            res.status(400).send({
                status: "failed",
                error: "accessToken missing."
            });
            return;
        } else getGrades(req.headers.accesstoken, res);
    })
    .get('/student/getSched', (req, res) => {

        if (!req.headers.accesstoken) {
            res.status(400).send({
                status: "failed",
                error: "accessToken missing."
            });
            return;
        } else getSched(req.headers.accesstoken, res);
    })
    .post('/auth/logout', (req, res) => {

        // Check for a session ID. If we don't have one, stop.
        if (!req.headers.accesstoken) {
            res.status(400).send({
                status: "failed",
                error: "accessToken missing."
            });
            return;
        } else logout(req.headers.accesstoken, res);

    })
    .get('/server/ping', (req, res) => {
        res.send({
            status: 'success',
            server: {
                version: process.env.npm_package_version,
                announcement: process.env.SERVER_ANNOUNCEMENT
            }
        });
    })

// Sentry middleware
app.use(Handlers.errorHandler());
app.use(function onError(err, req, res, next) {
    winston.error(err.stack)
    res.status(500).send({
        status: 'failed',
        error: err.message
    });
});

// Listen on whatever port is selected
app.listen(process.env.PORT, async () => {
    winston.info(`Edformer has started.`)
})