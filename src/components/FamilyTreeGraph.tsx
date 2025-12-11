import React, { useMemo } from "react";
import { Ancestor } from "../types";

interface FamilyTreeGraphProps {
  ancestors: Ancestor[];
  onEditAncestor: (ancestor: Ancestor) => void;
  onDeleteAncestor: (id: string) => void;
  onAddParent: (childId: string) => void;
  onAddChild: (parentId: string) => void;
}

interface TreeNode {
  ancestor: Ancestor;
  x: number;
  y: number;
  generation: number;
  relationship: string;
}

interface Connection {
  from: TreeNode;
  to: TreeNode;
  type: "parent" | "marriage";
}

// Helper function to infer relationship based on family tree position
function inferRelationship(
  ancestor: Ancestor,
  allAncestors: Ancestor[],
  selfId: string
): string {
  if (ancestor.id === selfId) return "Self";

  // Check if this person is a parent of self
  const selfAncestor = allAncestors.find((a) => a.id === selfId);
  if (
    selfAncestor &&
    (selfAncestor.parent1Id === ancestor.id ||
      selfAncestor.parent2Id === ancestor.id)
  ) {
    return "Parent";
  }

  // Check if this person is a child of self
  if (ancestor.parent1Id === selfId || ancestor.parent2Id === selfId) {
    return "Child";
  }

  // Check if this person is a grandparent (parent of self's parent)
  if (selfAncestor) {
    const parent1 = allAncestors.find((a) => a.id === selfAncestor.parent1Id);
    const parent2 = allAncestors.find((a) => a.id === selfAncestor.parent2Id);

    if (
      (parent1 &&
        (parent1.parent1Id === ancestor.id ||
          parent1.parent2Id === ancestor.id)) ||
      (parent2 &&
        (parent2.parent1Id === ancestor.id ||
          parent2.parent2Id === ancestor.id))
    ) {
      return "Grandparent";
    }
  }

  // Check if this person is a grandchild (child of self's child)
  const children = allAncestors.filter(
    (a) => a.parent1Id === selfId || a.parent2Id === selfId
  );
  for (const child of children) {
    if (ancestor.parent1Id === child.id || ancestor.parent2Id === child.id) {
      return "Grandchild";
    }
  }

  return "Relative";
}

const FamilyTreeGraph: React.FC<FamilyTreeGraphProps> = ({
  ancestors,
  onEditAncestor,
  onDeleteAncestor,
  onAddParent,
  onAddChild,
}) => {
  const { nodes, connections, dimensions } = useMemo(() => {
    if (ancestors.length === 0) {
      return {
        nodes: [],
        connections: [],
        dimensions: { width: 800, height: 400 },
      };
    }

    // Find the "self" person as the root of the tree
    const selfPerson =
      ancestors.find((a) => {
        // Self is someone with no parents, or the first ancestor if none qualify
        return !a.parent1Id && !a.parent2Id;
      }) || ancestors[0];

    return buildTreeFromRoot(selfPerson, ancestors);
  }, [ancestors]);

  const getDisplayName = (ancestor: Ancestor): string => {
    // Always prioritize actual names if they exist
    const fullName = `${ancestor.firstName || ""} ${
      ancestor.lastName || ""
    }`.trim();
    if (fullName) {
      return fullName;
    }

    // Only show relationship if no name is provided
    const selfPerson =
      ancestors.find((a) => !a.parent1Id && !a.parent2Id) || ancestors[0];
    const relationship = inferRelationship(ancestor, ancestors, selfPerson.id);
    return relationship;
  };

  if (ancestors.length === 0) {
    return (
      <div className="family-tree">
        <div className="empty-state">
          <p>Loading family tree...</p>
        </div>
      </div>
    );
  }

  // Check if we only have a blank Self ancestor (new user experience)
  const selfPerson =
    ancestors.find((a) => !a.parent1Id && !a.parent2Id) || ancestors[0];
  const isNewUser =
    ancestors.length === 1 &&
    !selfPerson.firstName &&
    !selfPerson.lastName &&
    !selfPerson.birth &&
    !selfPerson.marriages?.length &&
    !selfPerson.divorces?.length &&
    !selfPerson.naturalizations?.length &&
    !selfPerson.death;

  return (
    <div className="family-tree">
      {isNewUser && (
        <div
          style={{
            textAlign: "center",
            marginBottom: "20px",
            padding: "15px",
            backgroundColor: "#e8f4fd",
            borderRadius: "8px",
            border: "1px solid #3498db",
          }}
        >
          <p style={{ margin: "0", color: "#2c3e50", fontSize: "14px" }}>
            <strong>Welcome!</strong> Start by clicking the edit button (✎) on
            the "Self" card to add your information, or use the + buttons to add
            parents above or children below.
          </p>
        </div>
      )}
      <div className="family-tree-graph">
        <svg
          width={dimensions.width}
          height={dimensions.height}
          style={{ border: "1px solid #ddd", borderRadius: "8px" }}
        >
          {/* Render connections first (behind nodes) */}
          {connections.map((connection, index) => (
            <g key={`connection-${index}`}>
              {connection.type === "parent" ? (
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
            const nodeWidth = Math.max(displayName.length * 8 + 40, 140);
            const nodeHeight = 80;

            return (
              <g key={node.ancestor.id}>
                {/* Add Parent button (above node) */}
                <circle
                  cx={node.x}
                  cy={node.y - nodeHeight / 2 - 25}
                  r="12"
                  fill="#27ae60"
                  style={{ cursor: "pointer" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log(
                      "Add parent button clicked for:",
                      node.ancestor.id
                    ); // Debug log
                    onAddParent(node.ancestor.id);
                  }}
                />
                <text
                  x={node.x}
                  y={node.y - nodeHeight / 2 - 21}
                  textAnchor="middle"
                  fontSize="16"
                  fill="white"
                  style={{ cursor: "pointer", userSelect: "none" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log(
                      "Add parent text clicked for:",
                      node.ancestor.id
                    ); // Debug log
                    onAddParent(node.ancestor.id);
                  }}
                >
                  +
                </text>

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
                />

                {/* Node text */}
                <text
                  x={node.x}
                  y={node.y - 10}
                  textAnchor="middle"
                  fontSize="14"
                  fontWeight="bold"
                  fill="#2c3e50"
                  style={{ userSelect: "none" }}
                >
                  {displayName}
                </text>

                {/* Birth year */}
                {node.ancestor.birth?.date?.year && (
                  <text
                    x={node.x}
                    y={node.y + 8}
                    textAnchor="middle"
                    fontSize="11"
                    fill="#7f8c8d"
                    style={{ userSelect: "none" }}
                  >
                    b. {node.ancestor.birth.date.year}
                  </text>
                )}

                {/* Edit button */}
                <circle
                  cx={node.x + nodeWidth / 2 - 15}
                  cy={node.y - nodeHeight / 2 + 15}
                  r="10"
                  fill="#3498db"
                  style={{ cursor: "pointer" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log("Edit button clicked for:", node.ancestor.id); // Debug log
                    onEditAncestor(node.ancestor);
                  }}
                />
                <text
                  x={node.x + nodeWidth / 2 - 15}
                  y={node.y - nodeHeight / 2 + 19}
                  textAnchor="middle"
                  fontSize="10"
                  fill="white"
                  style={{ cursor: "pointer", userSelect: "none" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log("Edit text clicked for:", node.ancestor.id); // Debug log
                    onEditAncestor(node.ancestor);
                  }}
                >
                  ✎
                </text>

                {/* Delete button */}
                <circle
                  cx={node.x + nodeWidth / 2 - 15}
                  cy={node.y + nodeHeight / 2 - 15}
                  r="8"
                  fill="#e74c3c"
                  style={{ cursor: "pointer" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log("Delete button clicked for:", node.ancestor.id); // Debug log
                    onDeleteAncestor(node.ancestor.id);
                  }}
                />
                <text
                  x={node.x + nodeWidth / 2 - 15}
                  y={node.y + nodeHeight / 2 - 11}
                  textAnchor="middle"
                  fontSize="10"
                  fill="white"
                  style={{ cursor: "pointer", userSelect: "none" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log("Delete text clicked for:", node.ancestor.id); // Debug log
                    onDeleteAncestor(node.ancestor.id);
                  }}
                >
                  ×
                </text>

                {/* Add Child button (below node) */}
                <circle
                  cx={node.x}
                  cy={node.y + nodeHeight / 2 + 25}
                  r="12"
                  fill="#27ae60"
                  style={{ cursor: "pointer" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log(
                      "Add child button clicked for:",
                      node.ancestor.id
                    ); // Debug log
                    onAddChild(node.ancestor.id);
                  }}
                />
                <text
                  x={node.x}
                  y={node.y + nodeHeight / 2 + 29}
                  textAnchor="middle"
                  fontSize="16"
                  fill="white"
                  style={{ cursor: "pointer", userSelect: "none" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log(
                      "Add child text clicked for:",
                      node.ancestor.id
                    ); // Debug log
                    onAddChild(node.ancestor.id);
                  }}
                >
                  +
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
  const GENERATION_HEIGHT = 180; // Increased spacing between generations
  const MIN_HORIZONTAL_SPACING = 200;

  // Build generation levels
  const generations = new Map<number, Ancestor[]>();
  const visited = new Set<string>();

  // Start with root at generation 0
  addToGeneration(root, 0, generations, allAncestors, visited);

  // Process any remaining unconnected ancestors
  const unconnectedAncestors = allAncestors.filter((a) => !visited.has(a.id));
  unconnectedAncestors.forEach(ancestor => {
    // Check if this ancestor has children that are already placed
    const hasPlacedChildren = allAncestors.some(child =>
      visited.has(child.id) && (child.parent1Id === ancestor.id || child.parent2Id === ancestor.id)
    );

    if (hasPlacedChildren) {
      // Find the highest generation of their children and place them one level up
      let maxChildGeneration = -1;
      allAncestors.forEach(child => {
        if (visited.has(child.id) && (child.parent1Id === ancestor.id || child.parent2Id === ancestor.id)) {
          // Find this child's generation
          for (const [gen, ancestorsInGen] of generations.entries()) {
            if (ancestorsInGen.some(a => a.id === child.id)) {
              maxChildGeneration = Math.max(maxChildGeneration, gen);
              break;
            }
          }
        }
      });

      if (maxChildGeneration >= 0) {
        const parentGeneration = maxChildGeneration + 1;
        if (!generations.has(parentGeneration)) {
          generations.set(parentGeneration, []);
        }
        generations.get(parentGeneration)!.push(ancestor);
        visited.add(ancestor.id);
      }
    } else {
      // Place truly unconnected ancestors in generation 0
      if (!generations.has(0)) {
        generations.set(0, []);
      }
      generations.get(0)!.push(ancestor);
      visited.add(ancestor.id);
    }
  });

  // Calculate positions
  let maxWidth = 0;
  let currentY = 400; // Start from bottom

  // Process generations from bottom (0) to top
  const sortedGenerations = Array.from(generations.entries()).sort(
    (a, b) => a[0] - b[0]
  );

  // Calculate the maximum number of nodes in any generation for consistent spacing
  const maxNodesInGeneration = Math.max(
    ...Array.from(generations.values()).map((gen) => gen.length)
  );
  const totalTreeWidth = maxNodesInGeneration * MIN_HORIZONTAL_SPACING;
  maxWidth = Math.max(maxWidth, totalTreeWidth);

  sortedGenerations.forEach(([generation, ancestorsInGen]) => {
    ancestorsInGen.forEach((ancestor, index) => {
      let x: number;

      // For direct parent-child relationships, maintain vertical alignment
      if (generation > 0) {
        // Check if this ancestor is a parent of someone in the generation below
        const childInBelowGeneration = allAncestors.find(child =>
          child.parent1Id === ancestor.id || child.parent2Id === ancestor.id
        );

        if (childInBelowGeneration) {
          // Find the child's position and align vertically
          const childNode = nodes.find(node => node.ancestor.id === childInBelowGeneration.id);
          if (childNode) {
            x = childNode.x; // Use same x position as child
          } else {
            // Fallback to centered positioning
            const genWidth = ancestorsInGen.length * MIN_HORIZONTAL_SPACING;
            const startX = (totalTreeWidth - genWidth) / 2;
            x = startX + index * MIN_HORIZONTAL_SPACING + MIN_HORIZONTAL_SPACING / 2;
          }
        } else {
          // No direct child relationship, use centered positioning
          const genWidth = ancestorsInGen.length * MIN_HORIZONTAL_SPACING;
          const startX = (totalTreeWidth - genWidth) / 2;
          x = startX + index * MIN_HORIZONTAL_SPACING + MIN_HORIZONTAL_SPACING / 2;
        }
      } else {
        // Generation 0 (root level), use centered positioning
        const genWidth = ancestorsInGen.length * MIN_HORIZONTAL_SPACING;
        const startX = (totalTreeWidth - genWidth) / 2;
        x = startX + index * MIN_HORIZONTAL_SPACING + MIN_HORIZONTAL_SPACING / 2;
      }

      const y = currentY - generation * GENERATION_HEIGHT;
      const relationship = inferRelationship(ancestor, allAncestors, root.id);

      const node: TreeNode = {
        ancestor,
        x,
        y,
        generation,
        relationship,
      };

      nodes.push(node);
      nodeMap.set(ancestor.id, node);
    });
  });

  // Center all nodes horizontally within the canvas
  const totalWidth = maxWidth + 200; // Add padding
  const offsetX = totalWidth / 2 - maxWidth / 2;

  nodes.forEach((node) => {
    node.x += offsetX;
  });

  // Create connections
  nodes.forEach((node) => {
    // Parent connections
    if (node.ancestor.parent1Id) {
      const parent1 = nodeMap.get(node.ancestor.parent1Id);
      if (parent1) {
        connections.push({ from: parent1, to: node, type: "parent" });
      }
    }

    if (node.ancestor.parent2Id) {
      const parent2 = nodeMap.get(node.ancestor.parent2Id);
      if (parent2) {
        connections.push({ from: parent2, to: node, type: "parent" });
      }
    }

    // Marriage connections
    node.ancestor.marriages?.forEach((marriage) => {
      if (marriage.partnerId) {
        const spouse = nodeMap.get(marriage.partnerId);
        if (spouse && spouse.generation === node.generation) {
          // Only add marriage line if we haven't already added it from the other direction
          const existingConnection = connections.find(
            (c) =>
              c.type === "marriage" &&
              ((c.from.ancestor.id === node.ancestor.id &&
                c.to.ancestor.id === spouse.ancestor.id) ||
                (c.from.ancestor.id === spouse.ancestor.id &&
                  c.to.ancestor.id === node.ancestor.id))
          );

          if (!existingConnection) {
            connections.push({ from: node, to: spouse, type: "marriage" });
          }
        }
      }
    });
  });

  const dimensions = {
    width: Math.max(maxWidth + 200, 800),
    height: Math.max(sortedGenerations.length * GENERATION_HEIGHT + 200, 500),
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
    const parent1 = allAncestors.find((a) => a.id === ancestor.parent1Id);
    if (parent1) {
      addToGeneration(
        parent1,
        generation + 1,
        generations,
        allAncestors,
        visited
      );
    }
  }

  if (ancestor.parent2Id) {
    const parent2 = allAncestors.find((a) => a.id === ancestor.parent2Id);
    if (parent2) {
      addToGeneration(
        parent2,
        generation + 1,
        generations,
        allAncestors,
        visited
      );
    }
  }

  // Add spouses to same generation
  ancestor.marriages?.forEach((marriage) => {
    if (marriage.partnerId) {
      const spouse = allAncestors.find((a) => a.id === marriage.partnerId);
      if (spouse && !visited.has(spouse.id)) {
        addToGeneration(spouse, generation, generations, allAncestors, visited);
      }
    }
  });
}

export default FamilyTreeGraph;
