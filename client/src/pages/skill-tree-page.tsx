import { useCallback } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { NavBar } from "@/components/nav-bar";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";

// Define skill node types
interface SkillNode extends Node {
  data: {
    label: string;
    level: number;
    description: string;
    isUnlocked: boolean;
    requirements: string[];
  };
}

// Initial nodes - representing different skills
const initialNodes: SkillNode[] = [
  {
    id: '1',
    type: 'input',
    data: {
      label: 'Fundamentals',
      level: 1,
      description: 'Master the basics of learning and study techniques',
      isUnlocked: true,
      requirements: [],
    },
    position: { x: 250, y: 0 },
  },
  {
    id: '2',
    data: {
      label: 'Time Management',
      level: 2,
      description: 'Learn to manage study time effectively',
      isUnlocked: false,
      requirements: ['Fundamentals'],
    },
    position: { x: 100, y: 100 },
  },
  {
    id: '3',
    data: {
      label: 'Advanced Study Techniques',
      level: 2,
      description: 'Master advanced learning methodologies',
      isUnlocked: false,
      requirements: ['Fundamentals'],
    },
    position: { x: 400, y: 100 },
  },
  {
    id: '4',
    data: {
      label: 'Project Management',
      level: 3,
      description: 'Learn to manage complex learning projects',
      isUnlocked: false,
      requirements: ['Time Management'],
    },
    position: { x: 100, y: 200 },
  },
  {
    id: '5',
    data: {
      label: 'Research Methods',
      level: 3,
      description: 'Develop advanced research capabilities',
      isUnlocked: false,
      requirements: ['Advanced Study Techniques'],
    },
    position: { x: 400, y: 200 },
  },
];

// Initial edges - connecting related skills
const initialEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2', animated: true },
  { id: 'e1-3', source: '1', target: '3', animated: true },
  { id: 'e2-4', source: '2', target: '4', animated: true },
  { id: 'e3-5', source: '3', target: '5', animated: true },
];

// Custom node component with animations
const CustomNode = ({ data }: { data: SkillNode['data'] }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.1 }}
      className={`p-4 rounded-lg shadow-lg ${
        data.isUnlocked
          ? 'bg-primary text-primary-foreground'
          : 'bg-muted text-muted-foreground'
      }`}
    >
      <h3 className="font-bold">{data.label}</h3>
      <p className="text-sm mt-1">Level {data.level}</p>
    </motion.div>
  );
};

// Node types configuration
const nodeTypes = {
  default: CustomNode,
  input: CustomNode,
};

export default function SkillTreePage() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    // Handle node click - unlock skills, show details, etc.
    console.log('Clicked node:', node);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="container mx-auto py-8 px-4">
        <Card className="p-6">
          <h1 className="text-3xl font-bold mb-6">Skill Tree</h1>
          <div className="h-[600px] w-full">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeClick={onNodeClick}
              nodeTypes={nodeTypes}
              fitView
            >
              <Background />
              <Controls />
            </ReactFlow>
          </div>
        </Card>
      </main>
    </div>
  );
}
