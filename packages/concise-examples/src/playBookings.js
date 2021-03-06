// @flow

/* eslint-disable no-console */

import path from 'path';
import Sequelize from 'sequelize';
import Concise from 'concise';
import { input } from 'concise-yaml';
import { output as outputSvg } from 'concise-diagram';
import { output as outputGraphql } from 'concise-graphql';
import { output as outputPg } from 'concise-pg';
import { output as outputSequelize } from 'concise-sequelize';
import { output as outputFirebase } from 'concise-firebase';

const run = async () => {
  const concise = new Concise();
  await concise.input(input, {
    file: path.join(
      __dirname,
      '../../__tests__/fixtures/schema4_bookings.yaml',
    ),
  });
  await concise.output(outputSvg, {
    file: path.join(__dirname, 'playBookings.svg'),
  });
  await concise.output(outputGraphql, {
    file: path.join(__dirname, 'playBookings.graphql'),
    relay: true,
    storyboard: true,
  });
  await concise.output(outputPg, {
    file: path.join(__dirname, 'playBookings.sql'),
  });
  await concise.output(outputFirebase, {
    file: path.join(__dirname, 'playBookings.firebase'),
  });
  await concise.output(outputSequelize, {
    Sequelize,
    sequelize: new Sequelize('db', 'user', 'pwd', {
      dialect: 'sqlite',
      logging: null,
    }),
  });
};

run();
