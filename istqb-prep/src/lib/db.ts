import {hasSb} from './supabase';import {sbDb} from './db.supabase';import {demoDb} from './db.demo';
import type {DB} from './types';
export const db:DB=hasSb?sbDb:demoDb;
