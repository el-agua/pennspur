import {
  motion,
  useMotionValue,
  useTransform,
  useAnimationControls,
} from "framer-motion";
import { useState, useEffect } from "react";
import SwipeIcon from "@mui/icons-material/Swipe";

interface Props {
  children: React.ReactNode;
  onAccept: () => void;
  onDeny: () => void;
}

const SwipeNotification = ({ children, onAccept, onDeny }: Props) => {
  const x = useMotionValue(0);

  // Green on right drag
  const leftBandWidth = useTransform(x, [0, 120], ["0%", "30%"]);

  // Red on left drag
  const rightBandWidth = useTransform(x, [0, -120], ["0%", "30%"]);

  const cursorControls = useAnimationControls();
  const [cursorVisible, setCursorVisible] = useState(true);

  useEffect(() => {
    cursorControls.start({
      x: [0, 10, -10, 0],
      opacity: [0, 1, 1, 0.7],
      transition: {
        duration: 2,
        ease: "easeInOut",
        repeat: Infinity, // LOOP FOREVER
      },
    });
  }, []);

  const handleDragStart = () => {
    setCursorVisible(false);
    cursorControls.stop();
  };

  return (
    <motion.div
      className="relative bg-white rounded-xl shadow-xl p-4 select-none overflow-hidden"
      drag="x"
      style={{ x }}
      dragConstraints={{ left: 0, right: 0 }}
      onDragStart={handleDragStart}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      onDragEnd={(_, info) => {
        if (info.offset.x > 120) onAccept();
        else if (info.offset.x < -120) onDeny();
      }}
    >
      <motion.div
        style={{ width: leftBandWidth }}
        className="absolute left-0 top-0 bottom-0 bg-green-500"
      />

      <motion.div
        style={{ width: rightBandWidth }}
        className="absolute right-0 top-0 bottom-0 bg-red-500"
      />

      {cursorVisible && (
        <motion.div
          animate={cursorControls}
          className="absolute bottom-2 right-2 pointer-events-none text-gray-400 text-lg font-semibold"
        >
          <SwipeIcon fontSize="medium" />
        </motion.div>
      )}

      {children}
    </motion.div>
  );
};

export default SwipeNotification;
