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
  const [zoom, setZoom] = React.useState(1);
  const [pan, setPan] = React.useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 });
  const containerRef = React.useRef<HTMLDivElement>(null);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.2, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.2, 0.5));
  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Use native event listener for wheel to allow preventDefault
  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      // Only handle if mouse is over the container
      if (e.target === container || container.contains(e.target as Node)) {
        e.preventDefault();
        e.stopPropagation();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setZoom((prev) => Math.max(0.5, Math.min(3, prev + delta)));
      }
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

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
    const rootCandidates = ancestors.filter(
      (a) => !a.parentIds || a.parentIds.length === 0
    );
    const selfPerson =
      rootCandidates.length > 0
        ? rootCandidates.reduce(
            (oldest, current) =>
              current.createdAt < oldest.createdAt ? current : oldest,
            rootCandidates[0]
          )
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
    ancestors.find((a) => !a.parentIds || a.parentIds.length === 0) ||
    ancestors[0];
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
      <div style={{ position: "relative" }}>
        <div
          style={{
            position: "absolute",
            top: "10px",
            right: "10px",
            display: "flex",
            gap: "5px",
            zIndex: 10,
          }}
        >
          <button
            onClick={handleZoomIn}
            style={{
              padding: "8px 12px",
              background: "#3498db",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
            title="Zoom In"
          >
            +
          </button>
          <button
            onClick={handleZoomOut}
            style={{
              padding: "8px 12px",
              background: "#3498db",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
            title="Zoom Out"
          >
            −
          </button>
          <button
            onClick={handleResetZoom}
            style={{
              padding: "8px 12px",
              background: "#95a5a6",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
            title="Reset Zoom"
          >
            ⟲
          </button>
        </div>
        <div
          ref={containerRef}
          className="family-tree-graph"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{
            cursor: isDragging ? "grabbing" : "grab",
          }}
        >
          <svg
            viewBox={`${-pan.x / zoom} ${-pan.y / zoom} ${
              dimensions.width / zoom
            } ${dimensions.height / zoom}`}
            style={{
              border: "1px solid #ddd",
              borderRadius: "8px",
              width: "100%",
              height: "auto",
              maxHeight: "80vh",
            }}
          >
            {/* Render generation gridlines */}
            {Array.from(new Set(nodes.map((n) => n.generation))).map((gen) => {
              const y = nodes.find((n) => n.generation === gen)?.y || 0;
              return (
                <g key={`gen-${gen}`}>
                  <line
                    x1={0}
                    y1={y + 40}
                    x2={dimensions.width}
                    y2={y + 40}
                    stroke="#e0e0e0"
                    strokeWidth="1"
                    strokeDasharray="5,5"
                  />
                  <text
                    x={10}
                    y={y + 35}
                    fontSize="10"
                    fill="#999"
                    style={{ userSelect: "none" }}
                  >
                    Gen {gen}
                  </text>
                </g>
              );
            })}

            {/* Render connections (behind nodes) */}
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
                      if (e.key === "Enter" || e.key === " ") {
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

                  {/* Additional info lines - each on separate line */}
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
                  {node.ancestor.marriages && node.ancestor.marriages.length > 0 && (
                    <text
                      x={node.x}
                      y={node.y + 20}
                      textAnchor="middle"
                      fontSize="11"
                      fill="#7f8c8d"
                      style={{ userSelect: "none" }}
                    >
                      m. {node.ancestor.marriages[0].date?.year || node.ancestor.marriages.length}
                    </text>
                  )}
                  {node.ancestor.naturalizations && node.ancestor.naturalizations.length > 0 && (
                    <text
                      x={node.x}
                      y={node.y + 32}
                      textAnchor="middle"
                      fontSize="11"
                      fill="#7f8c8d"
                      style={{ userSelect: "none" }}
                    >
                      n. {node.ancestor.naturalizations[0].date?.year || node.ancestor.naturalizations.length}
                    </text>
                  )}
                  {node.ancestor.death?.date?.year && (
                    <text
                      x={node.x}
                      y={node.y + 44}
                      textAnchor="middle"
                      fontSize="11"
                      fill="#7f8c8d"
                      style={{ userSelect: "none" }}
                    >
                      d. {node.ancestor.death.date.year}
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
                      if (e.key === "Enter" || e.key === " ") {
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
                      if (e.key === "Enter" || e.key === " ") {
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
                      if (e.key === "Enter" || e.key === " ") {
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
    </div>
  );
};

function buildTreeFromRoot(_root: Ancestor, allAncestors: Ancestor[]) {
  const nodes: TreeNode[] = [];
  const connections: Connection[] = [];
  const nodeMap = new Map<string, TreeNode>();

  // Constants for layout
  const GENERATION_HEIGHT = 180;
  const MIN_HORIZONTAL_SPACING = 200;
  const NODE_HEIGHT = 80;
  // const BUTTON_SPACE = 50; // Space for buttons above/below nodes
  const PADDING = 100; // Canvas padding

  // Group ancestors by generation
  const generations = new Map<number, Ancestor[]>();
  allAncestors.forEach((ancestor) => {
    const gen = ancestor.generation;
    if (!generations.has(gen)) {
      generations.set(gen, []);
    }
    generations.get(gen)!.push(ancestor);
  });

  const sortedGenerations = Array.from(generations.entries()).sort(
    (a, b) => a[0] - b[0]
  );

  const maxGeneration = Math.max(...Array.from(generations.keys()));
  // const minGeneration = Math.min(...Array.from(generations.keys()));

  // Position nodes - use a generous base Y to ensure top button always has room
  // Start far enough down to accommodate the parent button above the highest generation
  const BASE_Y = 200; // Fixed generous starting position

  sortedGenerations.forEach(([generation, ancestorsInGen]) => {
    ancestorsInGen.forEach((ancestor, index) => {
      // Center this generation's nodes
      const x = PADDING + (index + 0.5) * MIN_HORIZONTAL_SPACING;
      // Position based on generation offset from maximum
      // Higher generations (ancestors) get LOWER y values (appear higher on screen)
      const generationOffset = maxGeneration - generation;
      const y = BASE_Y + generationOffset * GENERATION_HEIGHT;

      const node: TreeNode = {
        ancestor,
        x,
        y,
        generation: ancestor.generation,
        relationship: ancestor.firstName || "Person",
      };

      nodes.push(node);
      nodeMap.set(ancestor.id, node);
    });
  });

  // Create connections
  nodes.forEach((node) => {
    const parentIds = node.ancestor.parentIds || [];
    parentIds.forEach((parentId) => {
      const parent = nodeMap.get(parentId);
      if (parent) {
        connections.push({ from: parent, to: node, type: "parent" });
      }
    });

    node.ancestor.marriages?.forEach((marriage) => {
      if (marriage.partnerId) {
        const spouse = nodeMap.get(marriage.partnerId);
        if (spouse && spouse.generation === node.generation) {
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

  // Calculate canvas dimensions based on ACTUAL element positions
  const maxNodesInGen = Math.max(
    ...Array.from(generations.values()).map((gen) => gen.length)
  );

  // Find the actual min and max Y positions of nodes
  const minNodeY = Math.min(...nodes.map((n) => n.y));
  const maxNodeY = Math.max(...nodes.map((n) => n.y));

  // Calculate the actual top and bottom bounds including buttons
  // Top button is at: minNodeY - NODE_HEIGHT/2 - 25 - 12 (button radius)
  const topBound = minNodeY - NODE_HEIGHT / 2 - 25 - 12;
  // Bottom button is at: maxNodeY + NODE_HEIGHT/2 + 25 + 12 (button radius)
  const bottomBound = maxNodeY + NODE_HEIGHT / 2 + 25 + 12;

  const dimensions = {
    width: maxNodesInGen * MIN_HORIZONTAL_SPACING + 2 * PADDING,
    // Height is the actual range of elements plus padding
    height: bottomBound - topBound + 2 * PADDING,
  };

  return { nodes, connections, dimensions };
}

export default FamilyTreeGraph;
