import Calculator from "@/components/calculator";
import DaypartingCalculator from "@/components/daytracking";
import FileUpload from "@/components/file-upload";
import Image from "next/image";

export default function Home() {
  return (
    <div>
      {/* <Calculator /> */}
      {/* <FileUpload /> */}
      <DaypartingCalculator />
    </div>
  );
}
