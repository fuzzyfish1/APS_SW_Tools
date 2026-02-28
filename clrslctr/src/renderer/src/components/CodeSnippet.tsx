import React, { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface CodeSnippetProps {
  code: string;
  language?: string;
}

const CodeSnippet: React.FC<CodeSnippetProps> = ({ code, language = 'typescript' }) => {
  const [isCopied, setIsCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', margin: '20px 0' }}>
      {/* Header / Copy Button Container */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 16px',
        backgroundColor: '#323232',
        color: '#ccc',
        fontSize: '12px',
        fontFamily: 'sans-serif'
      }}>
        <span>{language.toUpperCase()}</span>
        <button 
          onClick={copyToClipboard}
          style={{
            background: isCopied ? '#4CAF50' : '#444',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '4px 8px',
            cursor: 'pointer',
            transition: 'background 0.2s'
          }}
        >
          {isCopied ? 'Copied!' : 'Copy'}
        </button>
      </div>

      {/* The Actual Code Box */}
      <SyntaxHighlighter 
        language={language} 
        style={vscDarkPlus}
        customStyle={{
          margin: 0,
          padding: '20px',
          fontSize: '14px',
          lineHeight: '1.5',
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
};

export default CodeSnippet;
