const fs=require("fs");
const q=String.fromCharCode(39);
const bt=String.fromCharCode(96);

// FILE 1: app/admin/books/new/page.tsx
const f1=[];
f1.push(q+"use client"+q);
f1.push("");
f1.push("import { useState } from "+q+"react"+q);
f1.push("import { useRouter } from "+q+"next/navigation"+q);
f1.push("import Image from "+q+"next/image"+q);
f1.push("import Link from "+q+"next/link"+q);
f1.push("import { CATEGORIES } from "+q+"@/lib/translations"+q);
f1.push("import { supabase } from "+q+"@/lib/supabase"+q);
f1.push("");
f1.push("const CONDITIONS = ["+q+"Like New"+q+", "+q+"Very Good"+q+", "+q+"Good"+q+", "+q+"Well Read"+q+"]");
f1.push("");
f1.push("type ImageSlot = { file: File | null; preview: string }");
