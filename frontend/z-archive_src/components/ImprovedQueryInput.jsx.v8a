/*
  Version: v1.0.0.0
  Added: 8/9/25
  Location: frontend/rag-ui-new/src/components/

  ImprovedQueryInput.jsx

  This component wraps a ``textarea`` with behaviour tailored for a
  question/answer interface.  Users can press **Enter** to submit
  their query immediately, while **Shift+Enter** inserts a newline
  without submitting—similar to many chat applications.  A fallback
  submit button is provided for accessibility and discoverability.

  Props:
    - onSubmit (function): Called with the current text when the user
      submits a query.
*/

import React, { useState, useCallback } from 'react';

export default function ImprovedQueryInput({ onSubmit }) {
  const [value, setValue] = useState('');

  const handleChange = (event) => {
    setValue(event.target.value);
  };

  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === 'Enter') {
        if (event.shiftKey) {
          // Allow newline when holding Shift
          return;
        }
        // Prevent default newline insertion and submit the query
        event.preventDefault();
        submitQuery();
      }
    },
    [value]
  );

  const submitQuery = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || typeof onSubmit !== 'function') return;
    onSubmit(trimmed);
    setValue('');
  }, [value, onSubmit]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <textarea
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Type your query… (Shift+Enter for newline)"
        style={{
          width: '100%',
          minHeight: 80,
          padding: 8,
          borderRadius: 4,
          border: '1px solid #ccc',
          resize: 'vertical',
        }}
      />
      <button
        type="button"
        onClick={submitQuery}
        style={{
          alignSelf: 'flex-end',
          padding: '6px 12px',
          backgroundColor: '#4caf50',
          color: '#fff',
          border: 'none',
          borderRadius: 4,
          cursor: 'pointer',
        }}
      >
        Submit Query
      </button>
    </div>
  );
}