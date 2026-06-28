'use client'
import { useCallback } from 'react'
import { getContactsPageData } from '../services/contactsApi'
export function useContacts() { return useCallback((token: string) => getContactsPageData(token), []) }
