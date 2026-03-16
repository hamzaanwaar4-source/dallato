import { tripsApi, adaptApiItineraryToUI } from './trips.api';
import { DayItem } from '@/lib/types/itinerary';

export const getItinerary = async (itineraryId?: number): Promise<DayItem[]> => {
    if (!itineraryId) {
        // Fallback or handle error
        return [];
    }
    const apiItinerary = await tripsApi.getItinerary(itineraryId);
    return adaptApiItineraryToUI(apiItinerary);
};
