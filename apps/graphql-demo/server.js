import express from 'express';
import cors from 'cors';
import { graphqlHTTP } from 'express-graphql';
import { buildSchema } from 'graphql';

const schema = buildSchema(`
  type Query {
    hello: String
    randomNumber: Float!
    greet(name: String!): String!
  }
`);

const root = {
  hello: () => 'Hello GraphQL!',
  randomNumber: () => Math.random(),
  greet: ({ name }) => `Hello, ${name}!`
};

const app = express();
app.use(cors());
app.use('/graphql', graphqlHTTP({
  schema,
  rootValue: root,
  graphiql: true
}));

const port = 4000;
app.listen(port, () => {
  console.log(`GraphQL server running at http://localhost:${port}/graphql`);
});
