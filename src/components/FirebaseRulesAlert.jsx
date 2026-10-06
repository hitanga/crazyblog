import React, { useState } from 'react';
import { AlertTriangle, Copy, Check, ExternalLink } from 'lucide-react';
import firebaseConfig from '../config/firebaseAppletConfig.js';

export default function FirebaseRulesAlert({ error, onRetry }) {
  const [copied, setCopied] = useState(false);

  const rulesSnippet = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(rulesSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const isPermissionError =
    error &&
    (error.includes('insufficient permissions') ||
      error.includes('permission-denied') ||
      error.includes('PERMISSION_DENIED'));

  if (!isPermissionError) return null;

  return (
    <div className="w-full max-w-[1240px] mx-auto my-6 px-4">
      <div className="bg-amber-50 border-2 border-amber-300 p-5 rounded-none shadow-sm">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-sans font-bold text-sm text-amber-900 uppercase tracking-wider">
              Firebase Firestore Security Rules Need to Be Published
            </h3>
            <p className="text-xs text-amber-800 mt-1 leading-relaxed">
              Your Firebase project (<strong>{firebaseConfig.projectId}</strong>) currently has locked Firestore security rules, which prevents reading and writing articles.
            </p>

            <div className="mt-3 p-3 bg-stone-900 text-stone-100 font-mono text-[11px] relative rounded-none">
              <pre className="overflow-x-auto">{rulesSnippet}</pre>
              <button
                type="button"
                onClick={handleCopy}
                className="absolute top-2.5 right-2.5 px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-stone-200 text-[10px] font-sans font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied!' : 'Copy Rules'}</span>
              </button>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <a
                href={`https://console.firebase.google.com/project/${firebaseConfig.projectId}/firestore/rules`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold uppercase tracking-wider transition-colors"
              >
                <span>Open Rules in Firebase Console</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="px-3.5 py-1.5 bg-white hover:bg-stone-100 text-stone-800 border border-stone-300 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Retry Connection
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
