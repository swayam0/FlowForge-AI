'use client';

import React, { useState, useMemo } from 'react';
import { Copy, Download, Search, ChevronRight, ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface JsonViewerProps {
  data: any;
  className?: string;
}

const JsonNode = ({ 
  keyName, 
  value, 
  isLast, 
  level,
  searchQuery
}: { 
  keyName: string | null;
  value: any;
  isLast: boolean;
  level: number;
  searchQuery: string;
}) => {
  const [expanded, setExpanded] = useState(true);
  const isObject = value !== null && typeof value === 'object';
  const isArray = Array.isArray(value);

  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded(!expanded);
  };

  const matchesSearch = searchQuery && 
    (
      (keyName && keyName.toLowerCase().includes(searchQuery.toLowerCase())) || 
      (!isObject && String(value).toLowerCase().includes(searchQuery.toLowerCase()))
    );

  if (isObject) {
    const keys = Object.keys(value);
    const isEmpty = keys.length === 0;

    return (
      <div className={cn("font-mono text-[13px] leading-relaxed", level > 0 && "ml-4")}>
        <div 
          className={cn(
            "flex items-start group cursor-pointer hover:bg-white/5 py-0.5 px-1 -mx-1 rounded",
            matchesSearch && "bg-blue-500/20"
          )}
          onClick={toggle}
        >
          {!isEmpty && (
            <span className="mr-1 mt-0.5 text-gray-500 shrink-0">
              {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </span>
          )}
          {isEmpty && <span className="w-4 shrink-0" />}
          
          {keyName && <span className="text-blue-400 mr-2">"{keyName}":</span>}
          <span className="text-gray-400">{isArray ? '[' : '{'}</span>
          {!expanded && !isEmpty && (
            <span className="text-gray-500 mx-2">
              {isArray ? `... ${keys.length} items ...` : `... ${keys.length} keys ...`}
            </span>
          )}
          {(!expanded || isEmpty) && (
            <span className="text-gray-400">
              {isArray ? ']' : '}'}{!isLast && ','}
            </span>
          )}
        </div>

        {expanded && !isEmpty && (
          <div>
            {keys.map((k, i) => (
              <JsonNode 
                key={k}
                keyName={isArray ? null : k}
                value={value[k as keyof typeof value]}
                isLast={i === keys.length - 1}
                level={level + 1}
                searchQuery={searchQuery}
              />
            ))}
            <div className={cn("text-gray-400", level > 0 ? "ml-4" : "ml-4")}>
              {isArray ? ']' : '}'}{!isLast && ','}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Primitive value
  let valueColor = 'text-green-400';
  let displayValue = String(value);

  if (typeof value === 'number') {
    valueColor = 'text-orange-400';
  } else if (typeof value === 'boolean') {
    valueColor = 'text-pink-400';
  } else if (value === null) {
    valueColor = 'text-gray-500';
    displayValue = 'null';
  } else if (typeof value === 'string') {
    displayValue = `"${value}"`;
  }

  return (
    <div className={cn("font-mono text-[13px] leading-relaxed ml-4 py-0.5 px-1 -mx-1 rounded", 
      matchesSearch && "bg-blue-500/20"
    )}>
      <span className="w-4 inline-block shrink-0" />
      {keyName && <span className="text-blue-400 mr-2">"{keyName}":</span>}
      <span className={valueColor}>{displayValue}</span>
      {!isLast && <span className="text-gray-400">,</span>}
    </div>
  );
};

export function JsonViewer({ data, className }: JsonViewerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);

  const jsonString = useMemo(() => {
    try {
      return JSON.stringify(data, null, 2);
    } catch (e) {
      return '';
    }
  }, [data]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy');
    }
  };

  const handleDownload = () => {
    try {
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `data-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Download started');
    } catch (err) {
      toast.error('Failed to download');
    }
  };

  if (data === undefined) {
    return <div className="text-gray-500 font-mono text-sm p-4">undefined</div>;
  }

  return (
    <div className={cn("flex flex-col h-full bg-[#050505] border border-white/5 rounded-lg overflow-hidden", className)}>
      <div className="flex items-center justify-between p-2 border-b border-white/5 bg-[#0a0a0a]">
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-2 h-4 w-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search JSON..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-md py-1.5 pl-9 pr-3 text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-md transition-colors"
            title="Copy JSON"
          >
            {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
          </button>
          <button
            onClick={handleDownload}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-md transition-colors"
            title="Download JSON"
          >
            <Download className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-4 custom-scrollbar">
        <JsonNode 
          keyName={null} 
          value={data} 
          isLast={true} 
          level={0} 
          searchQuery={searchQuery}
        />
      </div>
    </div>
  );
}
