import ERDiagram from '../models/ERDiagram.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * Get all ER Diagrams for a project.
 */
const getDiagramsByProject = asyncHandler(async (req, res) => {
  const { projectId } = req.query;
  if (!projectId) {
    throw ApiError.badRequest('Project ID query parameter is required');
  }
  const diagrams = await ERDiagram.find({ projectId, createdBy: req.user._id })
    .select('name description projectId createdAt updatedAt')
    .sort({ updatedAt: -1 });

  ApiResponse.success({ diagrams }, 'Diagrams retrieved successfully').send(res);
});

/**
 * Get a single ER Diagram by ID.
 */
const getDiagramById = asyncHandler(async (req, res) => {
  const diagram = await ERDiagram.findOne({ _id: req.params.id, createdBy: req.user._id });
  if (!diagram) {
    throw ApiError.notFound('ER Diagram not found');
  }
  ApiResponse.success({ diagram }, 'Diagram retrieved successfully').send(res);
});

/**
 * Create a new ER Diagram.
 */
const createDiagram = asyncHandler(async (req, res) => {
  const { name, description, projectId, code, nodes, edges } = req.body;
  if (!name || !projectId) {
    throw ApiError.badRequest('Name and Project ID are required');
  }

  const diagram = await ERDiagram.create({
    name,
    description: description || '',
    projectId,
    code: code || '',
    nodes: nodes || [],
    edges: edges || [],
    createdBy: req.user._id,
    versions: [
      {
        versionNumber: 1,
        code: code || '',
        nodes: nodes || [],
        edges: edges || [],
        createdBy: req.user._id,
      },
    ],
  });

  ApiResponse.created({ diagram }, 'ER Diagram created successfully').send(res);
});

/**
 * Update an existing ER Diagram.
 */
const updateDiagram = asyncHandler(async (req, res) => {
  const { name, description, code, nodes, edges, createNewVersion } = req.body;
  const diagram = await ERDiagram.findOne({ _id: req.params.id, createdBy: req.user._id });

  if (!diagram) {
    throw ApiError.notFound('ER Diagram not found');
  }

  if (name) diagram.name = name;
  if (description !== undefined) diagram.description = description;
  if (code !== undefined) diagram.code = code;
  if (nodes !== undefined) diagram.nodes = nodes;
  if (edges !== undefined) diagram.edges = edges;

  if (createNewVersion) {
    const nextVer = (diagram.versions.length ? Math.max(...diagram.versions.map(v => v.versionNumber)) : 0) + 1;
    diagram.versions.push({
      versionNumber: nextVer,
      code: diagram.code,
      nodes: diagram.nodes,
      edges: diagram.edges,
      createdBy: req.user._id,
    });
  }

  await diagram.save();
  ApiResponse.success({ diagram }, 'ER Diagram updated successfully').send(res);
});

/**
 * Delete an ER Diagram.
 */
const deleteDiagram = asyncHandler(async (req, res) => {
  const diagram = await ERDiagram.findOneAndDelete({ _id: req.params.id, createdBy: req.user._id });
  if (!diagram) {
    throw ApiError.notFound('ER Diagram not found');
  }
  ApiResponse.success(null, 'ER Diagram deleted successfully').send(res);
});

/**
 * Restore a specific version of the ER Diagram.
 */
const restoreDiagramVersion = asyncHandler(async (req, res) => {
  const { versionNumber } = req.params;
  const diagram = await ERDiagram.findOne({ _id: req.params.id, createdBy: req.user._id });

  if (!diagram) {
    throw ApiError.notFound('ER Diagram not found');
  }

  const version = diagram.versions.find(v => v.versionNumber === parseInt(versionNumber, 10));
  if (!version) {
    throw ApiError.notFound(`Version ${versionNumber} not found`);
  }

  diagram.code = version.code;
  diagram.nodes = version.nodes;
  diagram.edges = version.edges;

  // Add a new version showing it was restored
  const nextVer = (diagram.versions.length ? Math.max(...diagram.versions.map(v => v.versionNumber)) : 0) + 1;
  diagram.versions.push({
    versionNumber: nextVer,
    code: version.code,
    nodes: version.nodes,
    edges: version.edges,
    createdBy: req.user._id,
  });

  await diagram.save();
  ApiResponse.success({ diagram }, `Restored version ${versionNumber} successfully`).send(res);
});

export default {
  getDiagramsByProject,
  getDiagramById,
  createDiagram,
  updateDiagram,
  deleteDiagram,
  restoreDiagramVersion,
};
