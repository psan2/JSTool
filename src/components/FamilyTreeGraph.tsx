import React, { useMemo } from 'react';
import { Ancestor } from '../types';

interface FamilyTreeGraphProps {
  ancestors: Ancestor[];
  onEditAncestor: (ancestor: Ancestor) => void;
  onDeleteAncestor: (id: string) => void;
}

interface TreeNode {
  ancestor: Ancestor;
  x: number;
  y: number;
  generation: number;
}

interface Connection {
  from: TreeNode;
  to: TreeNode;
  type: 'parent' | 'marriage';
}

const FamilyTreeGraph: React.FC<FamilyTreeGraphProps> = ({ ancestors, onEditAncestor, onDeleteAncestor }) => {
  const { nodes, connections, dimensions } = useMemo(() => {
    if (ancestors.length === 0) {
      return { nodes: [], connections: [], dimensions: { width: 800, height: 400 } };
    }

    // Find the "self" person as the root of the tree
    const selfPerson = ancestors.find(a => a.relationship === 'self');
    if (!selfPerson) {
      // If no self, use the first person as root
      return buildTreeFromRoot(ancestors[0], ancestors);
    }

    return buildTreeFromRoot(selfPerson, ancestors);
  }, [ancestors]);

  const getDisplayName = (ancestor: Ancestor): string => {
    if (ancestor.firstName || ancestor.lastName) {
      return `${ancestor.firstName || ''} ${ancestor.lastName || ''}`.trim();
    }
    return ancestor.relationship.charAt(0).toUpperCase() + ancestor.relationship.slice(1).replace('-', ' ');
  };

  if (ancestors.length === 0) {
    return (
      <div className="family-tree">
        <div className="empty-state">
          <p>No ancestors added yet. Click "Add Ancestor" to get started.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="family-tree">
      <div className="family-tree-graph">
        <svg width={dimensions.width} height={dimensions.height} style={{ border: '1px solid #ddd', borderRadius: '8px' }}>
          {/* Render connections first (behind nodes) */}
          {connections.map((connection, index) => (
            <g key={`connection-${index}`}>
              {connection.type === 'parent' ? (
                // Parent-child line (vertical)
                <line
                  x1={connection.from.x}
                  y1={connection.from.y}
                  x2={connection.to.x}
                  y2={connection.to.y}
                  stroke="#3498db"
                  strokeWidth="2"
                />
              ) : (
                // Marriage line (horizontal)
                <line
                  x1={connection.from.x}
                  y1={connection.from.y}
                  x2={connection.to.x}
                  y2={connection.to.y}
                  stroke="#e74c3c"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                />
              )}
            </g>
          ))}

          {/* Render nodes */}
          {nodes.map((node) => {
            const displayName = getDisplayName(node.ancestor);
            const nodeWidth = Math.max(displayName.length * 8 + 20, 120);
            const nodeHeight = 60;

            return (
              <g key={node.ancestor.id}>
                {/* Node background */}
                <rect
                  x={node.x - nodeWidth / 2}
                  y={node.y - nodeHeight / 2}
                  width={nodeWidth}
                  height={nodeHeight}
                  fill="#f8f9fa"
                  stroke="#3498db"
                  strokeWidth="2"
                  rx="8"
                  style={{ cursor: 'pointer' }}
                  onClick={() => onEditAncestor(node.ancestor)}
                />

                {/* Node text */}
                <text
                  x={node.x}
                  y={node.y - 5}
                  textAnchor="middle"
                  fontSize="14"
                  fontWeight="bold"
                  fill="#2c3e50"
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                  onClick={() => onEditAncestor(node.ancestor)}
                >
                  {displayName}
                </text>

                {/* Birth year */}
                {node.ancestor.birth?.date?.year && (
                  <text
                    x={node.x}
                    y={node.y + 12}
                    textAnchor="middle"
                    fontSize="11"
                    fill="#7f8c8d"
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                    onClick={() => onEditAncestor(node.ancestor)}
                  >
                    b. {node.ancestor.birth.date.year}
                  </text>
                )}

                {/* Delete button */}
                <circle
                  cx={node.x + nodeWidth / 2 - 10}
                  cy={node.y - nodeHeight / 2 + 10}
                  r="8"
                  fill="#e74c3c"
                  style={{ cursor: 'pointer' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteAncestor(node.ancestor.id);
                  }}
                />
                <text
                  x={node.x + nodeWidth / 2 - 10}
                  y={node.y - nodeHeight / 2 + 14}
                  textAnchor="middle"
                  fontSize="10"
                  fill="white"
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteAncestor(node.ancestor.id);
                  }}
                >
                  ×
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

function buildTreeFromRoot(root: Ancestor, allAncestors: Ancestor[]) {
  const nodes: TreeNode[] = [];
  const connections: Connection[] = [];
  const nodeMap = new Map<string, TreeNode>();

  // Constants for layout
  const NODE_WIDTH = 150;
  const NODE_HEIGHT = 80;
  const GENERATION_HEIGHT = 120;
  const MIN_HORIZONTAL_SPACING = 180;

  // Build generation levels
  const generations = new Map<number, Ancestor[]>();
  const visited = new Set<string>();

  // Start with root at generation 0
  addToGeneration(root, 0, generations, allAncestors, visited);

  // Calculate positions
  let maxWidth = 0;
  let currentY = 400; // Start from bottom

  // Process generations from bottom (0) to top
  const sortedGenerations = Array.from(generations.entries()).sort((a, b) => a[0] - b[0]);

  sortedGenerations.forEach(([generation, ancestorsInGen]) => {
    const genWidth = ancestorsInGen.length * MIN_HORIZONTAL_SPACING;
    maxWidth = Math.max(maxWidth, genWidth);

    const startX = (genWidth - MIN_HORIZONTAL_SPACING) / 2;

    ancestorsInGen.forEach((ancestor, index) => {
      const x = startX + (index * MIN_HORIZONTAL_SPACING) + MIN_HORIZONTAL_SPACING / 2;
      const y = currentY - (generation * GENERATION_HEIGHT);

      const node: TreeNode = {
        ancestor,
        x: x + 100, // Offset for padding
        y,
        generation
      };

      nodes.push(node);
      nodeMap.set(ancestor.id, node);
    });
  });

  // Create connections
  nodes.forEach(node => {
    // Parent connections
    if (node.ancestor.parent1Id) {
      const parent1 = nodeMap.get(node.ancestor.parent1Id);
      if (parent1) {
        connections.push({ from: parent1, to: node, type: 'parent' });
      }
    }

    if (node.ancestor.parent2Id) {
      const parent2 = nodeMap.get(node.ancestor.parent2Id);
      if (parent2) {
        connections.push({ from: parent2, to: node, type: 'parent' });
      }
    }

    // Marriage connections
    node.ancestor.marriages?.forEach(marriage => {
      if (marriage.partnerId) {
        const spouse = nodeMap.get(marriage.partnerId);
        if (spouse && spouse.generation === node.generation) {
          // Only add marriage line if we haven't already added it from the other direction
          const existingConnection = connections.find(c =>
            c.type === 'marriage' &&
            ((c.from.ancestor.id === node.ancestor.id && c.to.ancestor.id === spouse.ancestor.id) ||
             (c.from.ancestor.id === spouse.ancestor.id && c.to.ancestor.id === node.ancestor.id))
          );

          if (!existingConnection) {
            connections.push({ from: node, to: spouse, type: 'marriage' });
          }
        }
      }
    });
  });

  const dimensions = {
    width: Math.max(maxWidth + 200, 800),
    height: Math.max((sortedGenerations.length * GENERATION_HEIGHT) + 200, 400)
  };

  return { nodes, connections, dimensions };
}

function addToGeneration(
  ancestor: Ancestor,
  generation: number,
  generations: Map<number, Ancestor[]>,
  allAncestors: Ancestor[],
  visited: Set<string>
) {
  if (visited.has(ancestor.id)) return;
  visited.add(ancestor.id);

  // Add to current generation
  if (!generations.has(generation)) {
    generations.set(generation, []);
  }
  generations.get(generation)!.push(ancestor);

  // Add parents to next generation up
  if (ancestor.parent1Id) {
    const parent1 = allAncestors.find(a => a.id === ancestor.parent1Id);
    if (parent1) {
      addToGeneration(parent1, generation + 1, generations, allAncestors, visited);
    }
  }

  if (ancestor.parent2Id) {
    const parent2 = allAncestors.find(a => a.id === ancestor.parent2Id);
    if (parent2) {
      addToGeneration(parent2, generation + 1, generations, allAncestors, visited);
    }
  }

  // Add spouses to same generation
  ancestor.marriages?.forEach(marriage => {
    if (marriage.partnerId) {
      const spouse = allAncestors.find(a => a.id === marriage.partnerId);
      if (spouse && !visited.has(spouse.id)) {
        addToGeneration(spouse, generation, generations, allAncestors, visited);
      }
    }
  });
}

export default FamilyTreeGraph;
