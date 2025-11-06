"use client";

import { DEFAULT_PAGE } from "@/constants";
import { parseAsInteger, parseAsString, useQueryStates } from "nuqs";

export const useSubscriptionsFilters = () => {
    const [queryState, setQueryState] = useQueryStates({
        search: parseAsString.withDefault("").withOptions({ clearOnDefault: true }),
        page: parseAsInteger.withDefault(DEFAULT_PAGE).withOptions({ clearOnDefault: true }),
    });
    
    return { 
        filters: queryState, 
        setFilters: setQueryState 
    };
};

