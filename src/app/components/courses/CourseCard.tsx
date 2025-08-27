import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

export function CourseCard({ id, name, code, term, color }: { 
  id: string; 
  name: string; 
  code?: string; 
  term?: string; 
  color?: string 
}) {
  const colors = [
    "from-blue-500 to-blue-600",
    "from-green-500 to-green-600", 
    "from-purple-500 to-purple-600",
    "from-orange-500 to-orange-600",
    "from-red-500 to-red-600",
    "from-indigo-500 to-indigo-600"
  ];
  
  // Use a consistent color based on course ID
  const colorIndex = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
  const gradient = colors[colorIndex];

  return (
    <Link href={`/courses/${id}`}>
      <Card className="group relative overflow-hidden card-hover bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        {/* Subtle gradient overlay */}
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-5 group-hover:opacity-10 transition-opacity duration-200`} />
        
        {/* Top accent border */}
        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-200`} />
        
        <CardHeader className="relative flex-row items-center justify-between pb-3">
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {name}
          </CardTitle>
          {color ? (
            <div 
              className="w-5 h-5 rounded-full shadow-sm border-2 border-white dark:border-gray-700" 
              style={{ backgroundColor: color }} 
            />
          ) : (
            <div className={`w-5 h-5 rounded-full bg-gradient-to-r ${gradient} shadow-sm border-2 border-white dark:border-gray-700`} />
          )}
        </CardHeader>
        
        <CardContent className="relative pt-0">
          <div className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors mb-4">
            {[code, term].filter(Boolean).join(" • ") || "No additional info"}
          </div>
          
          {/* Hover indicator */}
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Click to view
            </div>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default CourseCard;


