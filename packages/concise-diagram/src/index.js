// @flow

/* eslint-disable prefer-template */

import fs from 'fs';
import Viz from 'viz.js';
import { addDefaults } from 'timm';
import type {
  Schema,
  OutputProcessor,
  SchemaUtils,
  ModelName,
  FieldName,
} from 'concise-types';

/* eslint-disable max-len */
/* --
Output-only.

Output options:
* `filterEdges?` (`{ from: ModelName, to: ModelName, as: FieldName, isRequired: boolean } => boolean`):
  return `true` if a given edge must be shown. Default: all edges are shown
* `edgeLabels?` (`boolean` = `true`): show edge labels
-- */
/* eslint-enable max-len */
type OutputOptions = {
  file?: string,
  filterEdges?: ({
    from: ModelName,
    to: ModelName,
    as: FieldName,
    isRequired: boolean,
  }) => boolean,
  edgeLabels?: boolean,
};

const DEFAULT_OPTIONS = {
  edgeLabels: true,
};

// ====================================
// Main
// ====================================
const output: OutputProcessor = async (
  schema: Schema,
  options: OutputOptions,
  utils: SchemaUtils,
) => {
  const preprocessedSchema = utils.preprocess(schema);
  const vizInput = writeDiagram(
    preprocessedSchema,
    addDefaults(options, DEFAULT_OPTIONS),
  );
  const svg = Viz(vizInput);
  if (options.file) {
    fs.writeFileSync(options.file, svg, 'utf8');
  }
  return svg;
};

// ====================================
// Flow writer
// ====================================
const writeDiagram = ({ models }, options) => {
  const modelNames = Object.keys(models);
  const nodes = modelNames.map(modelName => {
    let node = modelName;
    const { description } = models[modelName];
    const props = [];
    if (description) {
      props.push(`comment="${description}"`);
      props.push(`tooltip="${description}"`);
    }
    if (props.length) node += ` [${props.join(', ')}]`;
    return node;
  });
  const edges = [];
  modelNames.forEach(modelName => {
    const { relations } = models[modelName];
    Object.keys(relations).forEach(relationName => {
      const edge = writeEdge(models, modelName, relationName, options);
      if (edge) edges.push(edge);
    });
  });
  return (
    'digraph "" {\n' + // `""` removes the background tooltip
    '  node [shape=box, fontname="sans-serif"];\n' +
    '  edge [fontsize=9, fontname="sans-serif"];\n' +
    nodes.map(o => `  ${o};\n`).join('') +
    edges.map(o => `  ${o};\n`).join('') +
    '}\n'
  );
};

const writeEdge = (
  models,
  modelName,
  relationName,
  { filterEdges, edgeLabels },
) => {
  const relation = models[modelName].relations[relationName];
  if (relation.isInverse) return null;
  const { validations, description, inverseName, isPlural } = relation;
  const isRequired = validations && validations.isRequired === true;
  if (
    filterEdges &&
    !filterEdges({
      from: modelName,
      to: relation.model,
      as: relationName,
      isRequired,
    })
  ) {
    return null;
  }
  const props = [];
  if (edgeLabels && relationName !== relation.model) {
    props.push(`label="&nbsp;${relationName}&nbsp;&nbsp;"`);
  }
  if (description) {
    props.push(`comment="${description}"`);
    props.push(`edgetooltip="${description}"`);
    props.push(`headtooltip="${description}"`);
    props.push(`labeltooltip="${description}"`);
  }
  props.push(`arrowhead=${isPlural ? 'crow' : 'normal'}`);
  if (inverseName != null) {
    const inverse = models[relation.model].relations[inverseName];
    if (!inverse) {
      throw new Error(
        `INVERSE_RELATION_NOT_FOUND ${relation.model}/${inverseName}`,
      );
    }
    props.push('dir=both');
    props.push(`arrowtail=${inverse.isPlural ? 'crow' : 'normal'}`);
  }
  if (!isRequired) props.push('style=dotted');
  let edge = `${modelName} -> ${relation.model}`;
  if (props.length) edge += ` [${props.join(', ')}]`;
  return edge;
};

// ====================================
// Public
// ====================================
export { output };
