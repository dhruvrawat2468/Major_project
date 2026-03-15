import { Link, useLocation } from "react-router-dom";
import { Code2, User } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Navbar = () => {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === "/" && location.pathname === "/") return true;
    if (path !== "/" && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-50 w-full glass border-b border-border/50 backdrop-blur-md"
    >
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="p-2 rounded-lg bg-gradient-primary glow-blue">
            <Code2 className="h-5 w-5 text-background" />
          </div>
          <span className="text-xl font-bold gradient-text">AI Code Tester</span>
        </Link>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-1">
            <Button
              variant={isActive("/") ? "default" : "ghost"}
              size="sm"
              asChild
              className="transition-all duration-250"
            >
              <Link to="/">Problems</Link>
            </Button>
            <Button
              variant={isActive("/dashboard") ? "default" : "ghost"}
              size="sm"
              asChild
              className="transition-all duration-250"
            >
              <Link to="/dashboard">Dashboard</Link>
            </Button>
          </div>

          <div className="flex items-center gap-2 glass px-3 py-1.5 rounded-full">
            <User className="h-4 w-4 text-muted-foreground" />
            <Badge variant="outline" className="border-primary/50 text-xs">
              Guest
            </Badge>
          </div>
        </div>
      </div>
    </motion.nav>
  );
};
