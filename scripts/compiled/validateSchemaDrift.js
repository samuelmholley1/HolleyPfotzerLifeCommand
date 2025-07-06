"use strict";
// scripts/validateSchemaDrift.ts
// Node.js script to automate detection of schema drift, especially missing foreign key constraints, by comparing live DB to canonical DDL.
// Usage: npx ts-node scripts/validateSchemaDrift.ts
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var supabase_js_1 = require("@supabase/supabase-js");
var fs = require("fs");
var path = require("path");
var SUPABASE_URL = process.env.SUPABASE_URL || '';
var SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your environment.');
    process.exit(1);
}
var supabase = (0, supabase_js_1.createClient)(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
function getLiveForeignKeys() {
    return __awaiter(this, void 0, void 0, function () {
        var sql;
        return __generator(this, function (_a) {
            sql = "\n    SELECT tc.table_name AS source_table, kcu.column_name AS source_column,\n           ccu.table_name AS target_table, ccu.column_name AS target_column\n    FROM information_schema.table_constraints AS tc\n    JOIN information_schema.key_column_usage AS kcu\n      ON tc.constraint_name = kcu.constraint_name\n      AND tc.table_schema = kcu.table_schema\n    JOIN information_schema.constraint_column_usage AS ccu\n      ON ccu.constraint_name = tc.constraint_name\n      AND ccu.table_schema = tc.table_schema\n    WHERE tc.constraint_type = 'FOREIGN KEY'\n      AND tc.table_schema = 'public'\n    ORDER BY source_table, source_column;\n  ";
            // Supabase does not support arbitrary SQL, so this requires a Postgres function or direct psql access.
            // For now, print the SQL for manual execution if needed.
            console.log('Run this SQL in your SQL tool to get live FKs:');
            console.log(sql);
            return [2 /*return*/];
        });
    });
}
function parseDDLSnapshot(ddlsqlPath) {
    // Parse the DDL file for foreign key constraints
    var ddl = fs.readFileSync(ddlsqlPath, 'utf-8');
    var fkRegex = /CONSTRAINT\s+(\S+)\s+FOREIGN KEY \(([^)]+)\) REFERENCES ([^(]+)\(([^)]+)\)/gi;
    var fks = [];
    var match;
    while ((match = fkRegex.exec(ddl)) !== null) {
        fks.push({
            constraint: match[1],
            source_column: match[2].trim(),
            target_table: match[3].trim(),
            target_column: match[4].trim(),
        });
    }
    return fks;
}
(function () { return __awaiter(void 0, void 0, void 0, function () {
    var ddlPath, expectedFKs;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: 
            // 1. Print instructions for live FKs (manual step for now)
            return [4 /*yield*/, getLiveForeignKeys()];
            case 1:
                // 1. Print instructions for live FKs (manual step for now)
                _a.sent();
                ddlPath = path.resolve(__dirname, '../DATABASE_SNAPSHOT_DDL.sql');
                expectedFKs = parseDDLSnapshot(ddlPath);
                console.log('Expected FKs from DDL snapshot:', expectedFKs);
                // 3. (Manual) Compare live FKs to expected FKs and report discrepancies
                console.log('\nCompare the above with your live DB output. Any missing FKs indicate schema drift.');
                return [2 /*return*/];
        }
    });
}); })();
