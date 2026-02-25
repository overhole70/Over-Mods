
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom';
import PageRenderer from './components/PageRenderer';
import ModDetails from './components/ModDetails';
import { db, auth } from './db';
import { AppMetadata } from './types/sdui';
import { User, Mod, MinecraftServer, NewsItem } from './types';
import { Loader2, Download } from 'lucide-react';
import { AdService } from './core/AdService';
import { onAuthStateChanged } from 'firebase/auth';

const CURRENT_VERSION = "1.0.0"; 

// Wrapper to inject useParams into PageRenderer
const PageWrapper = (props: any) => {
  const { pageId } = useParams();
  const navigate = useNavigate();
  
  // Handle "download" route specifically if needed, but PageRenderer handles it via activePage
  
  return (
    <PageRenderer 
      {...props} 
      activePage={pageId || 'home'} 
      onNavigate={(path: string) => navigate(`/${path}`)} 
    />
  );
};

// Wrapper for specific content type routes
const ModRouteWrapper = (props: any) => {
  const { code } = useParams();
  const navigate = useNavigate();
  // We pass the code via props or let ModDetails use useParams. 
  // The user instruction says ModDetails should use useParams.
  // We still need to pass other props like currentUser, onBack, etc.
  
  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8">
       <ModDetails 
         mod={null as any} // ModDetails will fetch it
         allMods={props.mods}
         currentUser={props.currentUser}
         onBack={() => navigate('/home')}
         onModClick={(m) => navigate(`/${m.shareCode || m.id}`)}
         onDownload={() => {}}
         onEdit={() => {}}
         onDelete={() => {}}
         onPublisherClick={(pid) => navigate(`/profile/${pid}`)} // Placeholder
         isFollowing={false}
         onFollow={() => {}}
         isOnline={true}
         isAdmin={props.isAdminAuthenticated}
       />
    </div>
  );
};

export default function App() {
  // ... (existing state)

  // ... (existing useEffects)

  // ... (existing commonProps)

  return (
    <Router>
      <Routes>
        <Route path="/mod/:code" element={<ModRouteWrapper {...commonProps} />} />
        <Route path="/rp/:code" element={<ModRouteWrapper {...commonProps} />} />
        <Route path="/map/:code" element={<ModRouteWrapper {...commonProps} />} />
        <Route path="/modpack/:code" element={<ModRouteWrapper {...commonProps} />} />
        
        <Route path="/:pageId" element={<PageWrapper {...commonProps} />} />
        <Route path="/" element={<Navigate to="/home" replace />} />
      </Routes>
    </Router>
  );
}
