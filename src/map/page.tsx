'use client';
import React, { useState, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import Header from '@/components/layout/header';
import MainSidebar from '@/components/layout/main-sidebar';
import BottomNav from '@/components/layout/bottom-nav';
import { getActiveTripId } from '@/lib/trip-manager';
import { Trip } from '@/lib/trip';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Icons from '@/components/icons';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useRouter } from 'next/navigation';
import { useDoc, useUser, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useMemoFirebase } from '@/hooks/use-memo-firebase';

const containerStyle = {
  width: '100%',
  height: '100%',
};

const center = {
  lat: 28.6139,
  lng: 77.2090,
};

function MapPage() {
  const [currentDay, setCurrentDay] = useState(1);
  const [markers, setMarkers] = useState<{ lat: number, lng: number }[]>([]);
  const [mapCenter, setMapCenter] = useState(center);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const router = useRouter();

  const { user } = useUser();
  const firestore = useFirestore();
  const activeTripId = getActiveTripId();

  const activeTripRef = useMemoFirebase(() => {
    if (!user || !activeTripId || !firestore) return null;
    return doc(firestore, 'users', user.uid, 'trips', activeTripId);
  }, [firestore, user, activeTripId]);

  const { data: activeTrip } = useDoc<Trip>(activeTripRef);

  useEffect(() => {
    if (activeTrip) {
      // In a real app, you'd geocode addresses to get lat/lng
      // For now, we'll use placeholder offsets
      const tripMarkers = activeTrip.itinerary.flatMap(day => 
        day.items.map((item, index) => ({
          lat: center.lat + (Math.random() - 0.5) * 0.1 * (index + 1),
          lng: center.lng + (Math.random() - 0.5) * 0.1 * (index + 1)
        }))
      );
      setMarkers(tripMarkers);
      if (tripMarkers.length > 0) {
        setMapCenter(tripMarkers[0]);
      }
    }
  }, [activeTrip]);
  
  const handleNewTrip = () => {
    router.push('/planner');
  };
  
  const renderOfflineMapSidebar = () => (
    <div className={`absolute top-0 right-0 h-full bg-background/80 backdrop-blur-sm z-10 transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'} w-80 border-l p-4`}>
       <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-lg">Offline Maps</h3>
          <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(false)}>
            <Icons.X className="h-4 w-4" />
          </Button>
       </div>
       <ScrollArea className="h-[calc(100%-4rem)]">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Downtown Area</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Downloaded: 2 days ago</p>
              <p className="text-sm text-muted-foreground">Size: 45 MB</p>
              <Button variant="outline" size="sm" className="mt-2 w-full">View</Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">North District</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Downloaded: 1 week ago</p>
              <p className="text-sm text-muted-foreground">Size: 82 MB</p>
               <Button variant="outline" size="sm" className="mt-2 w-full">View</Button>
            </CardContent>
          </Card>
        </div>
       </ScrollArea>
    </div>
  );

  return (
    <SidebarProvider>
      <MainSidebar trip={activeTrip} onNewTrip={handleNewTrip} />
      <div className="flex flex-col h-svh">
        <Header trip={activeTrip} currentDay={currentDay} onDayChange={setCurrentDay} onItineraryUpdate={() => {}} />
        <div className="flex flex-grow overflow-hidden">
          <SidebarInset className="flex-grow h-full relative">
            <MapComponent markers={markers} mapCenter={mapCenter} />
            {renderOfflineMapSidebar()}
          </SidebarInset>
        </div>
        <BottomNav />
      </div>
    </SidebarProvider>
  );
}

function MapComponent({ markers, mapCenter }: { markers: { lat: number; lng: number }[], mapCenter: { lat: number; lng: number }}) {
    const [isClient, setIsClient] = useState(false);
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

    useEffect(() => {
        setIsClient(true);
    }, []);

    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: apiKey,
        skip: !apiKey,
    });

    if (!isClient) {
        return <Skeleton className="w-full h-full" />;
    }

    if (!apiKey) {
        return (
            <div className="flex items-center justify-center h-full text-center p-4">
                Google Maps API key is not configured.<br />Please add `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` to your environment variables.
            </div>
        );
    }
    
    if (!isLoaded) {
        return <Skeleton className="w-full h-full" />;
    }

    return (
        <GoogleMap mapContainerStyle={containerStyle} center={mapCenter} zoom={12}>
            {markers.map((marker, index) => (
                <Marker key={index} position={marker} />
            ))}
        </GoogleMap>
    );
}

export default function MapPageWrapper() {
  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      <MapPage />
    </React.Suspense>
  )
}
