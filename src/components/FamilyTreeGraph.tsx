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

    // Find the root of the tree - the person with no parents
    // If multiple people have no parents, use the oldest by createdAt
    const rootCandidates = ancestors.filter(a => !a.parentIds || a.parentIds.length === 0);
    const selfPerson = rootCandidates.length > 0
      ? rootCandidates.reduce((oldest, current) =>
          current.createdAt < oldest.createdAt ? current : oldest
        , rootCandidates[0])
      : ancestors[0]; // Fallback to first ancestor if no root found

    return buildTreeFromRoot(selfPerson, ancestors);
  }, [ancestors]);

  const getDisplayName = (ancestor: Ancestor): string => {
    // Return the full name (firstName + lastName)
    // Since we now commit default relationship names to firstName,
    // this will show either the actual name or the relationship
    const fullName = `${ancestor.firstName || ""} ${
      ancestor.lastName || ""
    }`.trim();

    if (fullName) {
      return fullName;
    }

    // Fallback to "Person" if somehow no name exists
    return "Person";
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
    ancestors.find((a) => !a.parentIds || a.parentIds.length === 0) || ancestors[0];
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
                <g
                  role="button"
                  aria-label={`Add parent to ${displayName}`}
                  tabIndex={0}
                  style={{ cursor: "pointer" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddParent(node.ancestor.id);
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.stopPropagation();
                      onAddParent(node.ancestor.id);
                    }
                  }}
                >
                  <title>Add parent to {displayName}</title>
                  <circle
                    cx={node.x}
                    cy={node.y - nodeHeight / 2 - 25}
                    r="12"
                    fill="#27ae60"
                  />
                  <text
                    x={node.x}
                    y={node.y - nodeHeight / 2 - 21}
                    textAnchor="middle"
                    fontSize="16"
                    fill="white"
                    style={{ userSelect: "none" }}
                  >
                    +
                  </text>
                </g>

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
                <g
                  role="button"
                  aria-label={`Edit ${displayName}`}
                  tabIndex={0}
                  style={{ cursor: "pointer" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditAncestor(node.ancestor);
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.stopPropagation();
                      onEditAncestor(node.ancestor);
                    }
                  }}
                >
                  <title>Edit {displayName}</title>
                  <circle
                    cx={node.x + nodeWidth / 2 - 15}
                    cy={node.y - nodeHeight / 2 + 15}
                    r="10"
                    fill="#3498db"
                  />
                  <text
                    x={node.x + nodeWidth / 2 - 15}
                    y={node.y - nodeHeight / 2 + 19}
                    textAnchor="middle"
                    fontSize="10"
                    fill="white"
                    style={{ userSelect: "none" }}
                  >
                    ✎
                  </text>
                </g>

                {/* Delete button */}
                <g
                  role="button"
                  aria-label={`Delete ${displayName}`}
                  tabIndex={0}
                  style={{ cursor: "pointer" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteAncestor(node.ancestor.id);
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.stopPropagation();
                      onDeleteAncestor(node.ancestor.id);
                    }
                  }}
                >
                  <title>Delete {displayName}</title>
                  <circle
                    cx={node.x + nodeWidth / 2 - 15}
                    cy={node.y + nodeHeight / 2 - 15}
                    r="8"
                    fill="#e74c3c"
                  />
                  <text
                    x={node.x + nodeWidth / 2 - 15}
                    y={node.y + nodeHeight / 2 - 11}
                    textAnchor="middle"
                    fontSize="10"
                    fill="white"
                    style={{ userSelect: "none" }}
                  >
                    ×
                  </text>
                </g>

                {/* Add Child button (below node) */}
                <g
                  role="button"
                  aria-label={`Add child to ${displayName}`}
                  tabIndex={0}
                  style={{ cursor: "pointer" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddChild(node.ancestor.id);
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.stopPropagation();
                      onAddChild(node.ancestor.id);
                    }
                  }}
                >
                  <title>Add child to {displayName}</title>
                  <circle
                    cx={node.x}
                    cy={node.y + nodeHeight / 2 + 25}
                    r="12"
                    fill="#27ae60"
                  />
                  <text
                    x={node.x}
                    y={node.y + nodeHeight / 2 + 29}
                    textAnchor="middle"
                    fontSize="16"
                    fill="white"
                    style={{ userSelect: "none" }}
                  >
                    +
                  </text>
                </g>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

function buildTreeFromRoot(_root: Ancestor, allAncestors: Ancestor[]) {
  const nodes: TreeNode[] = [];
  const connections: Connection[] = [];
  const nodeMap = new Map<string, TreeNode>();

  // Constants for layout
  const GENERATION_HEIGHT = 180; // Spacing between generations
  const MIN_HORIZONTAL_SPACING = 200;

  // Group ancestors by their stored generation
  const generations = new Map<number, Ancestor[]>();

  allAncestors.forEach(ancestor => {
    const gen = ancestor.generation;
    if (!generations.has(gen)) {
      generations.set(gen, []);
    }
    generations.get(gen)!.push(ancestor);
  });

  // Calculate positions
  let maxWidth = 0;

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

  // Calculate total height needed and start from appropriate Y position
  const maxGeneration = Math.max(...Array.from(generations.keys()));
  const minGeneration = Math.min(...Array.from(generations.keys()));
  const totalGenerations = maxGeneration - minGeneration + 1;

  // Add padding at top and bottom
  const TOP_PADDING = 100;
  const BOTTOM_PADDING = 100;

  // Calculate Y position for generation 0 (Self)
  // Self should be positioned so that all ancestors fit above with padding
  const selfY = TOP_PADDING + maxGeneration * GENERATION_HEIGHT;

  sortedGenerations.forEach(([generation, ancestorsInGen]) => {
    // Calculate positions for all nodes in this generation
    // ensuring proper spacing between all nodes
    const genWidth = ancestorsInGen.length * MIN_HORIZONTAL_SPACING;
    const startX = (totalTreeWidth - genWidth) / 2;

    ancestorsInGen.forEach((ancestor, index) => {
      // Position nodes sequentially across the generation
      const x = startX + index * MIN_HORIZONTAL_SPACING + MIN_HORIZONTAL_SPACING / 2;
      const y = selfY - generation * GENERATION_HEIGHT;

      // Use the stored generation value
      const node: TreeNode = {
        ancestor,
        x,
        y,
        generation: ancestor.generation, // Use stored generation
        relationship: ancestor.firstName || "Person", // Use stored name
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
    const parentIds = node.ancestor.parentIds || [];
    parentIds.forEach(parentId => {
      const parent = nodeMap.get(parentId);
      if (parent) {
        connections.push({ from: parent, to: node, type: "parent" });
      }
    });

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
    height: Math.max(totalGenerations * GENERATION_HEIGHT + TOP_PADDING + BOTTOM_PADDING, 500),
  };

  return { nodes, connections, dimensions };
}

export default FamilyTreeGraph;
