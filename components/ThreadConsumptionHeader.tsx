import React from 'react';

interface HeaderInfoProps {
  buyer: string;
  sampleType: string;
  styleNumber: string;
  color: string;
  date: string;
  quantity: number;
}

const ThreadConsumptionHeader: React.FC<HeaderInfoProps> = ({ buyer, sampleType, styleNumber, color, date, quantity }) => {
  return (
    <div className="w-full border border-slate-300 mb-6">
      <div className="flex items-center border-b border-slate-300 p-2">
        <div className="w-12 h-12 bg-emerald-600 rounded-sm mr-4"></div>
        <h1 className="text-2xl font-bold text-slate-900">Square Denims Limited</h1>
      </div>
      <div className="bg-slate-100 text-center font-bold py-1 border-b border-slate-300">
        THREAD POSITION & CONSUMPTION
      </div>
      <table className="w-full text-sm">
        <tbody>
          <tr className="border-b border-slate-300">
            <td className="font-bold p-2 border-r border-slate-300 w-1/4">BUYER :</td>
            <td className="p-2 border-r border-slate-300 w-1/4">{buyer}</td>
            <td className="font-bold p-2 border-r border-slate-300 w-1/4">SAMPLE TYPE:</td>
            <td className="p-2 w-1/4">{sampleType}</td>
          </tr>
          <tr className="border-b border-slate-300">
            <td className="font-bold p-2 border-r border-slate-300">STYLE NUMBER :</td>
            <td className="p-2 border-r border-slate-300">{styleNumber}</td>
            <td className="font-bold p-2 border-r border-slate-300">Color:</td>
            <td className="p-2">{color}</td>
          </tr>
          <tr>
            <td className="font-bold p-2 border-r border-slate-300">DATE :</td>
            <td className="p-2 border-r border-slate-300">{date}</td>
            <td className="font-bold p-2 border-r border-slate-300">QUANTITY:</td>
            <td className="p-2">{quantity}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default ThreadConsumptionHeader;
