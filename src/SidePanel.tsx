// import { ChangeEvent, MouseEvent, useEffect, useRef, useState } from "react";
// import { Loader2Icon, LogOut, MoonIcon, PlusIcon, SearchIcon, Settings, SunIcon, UserPlus, Users, XIcon } from "lucide-react";
// import { DriveCategory, DriveService, StorageQuota } from "./services/DriveService.ts";
// import CreateMenu from "./components/CreateMenu.tsx";
// import GoogleSignIn from "./components/GoogleSignIn.tsx";
// import { HotkeyMap, useAuth, useFeatureFlags, useHotkeys, useFileExplorer, useSearch } from "./hooks/_index.ts";
// import { GDFile } from "./declarations/_index.ts";
// import ErrorMessage from "./components/ErrorMessage.tsx";
// import LoadingSpinner from "./components/LoadingSpinner.tsx";
// import NavSection from "./components/NavSection.tsx";
// import StorageUsage from "./components/StorageUsage.tsx";
// import { Button } from "./components/ui/button.tsx";
// import { Avatar, AvatarFallback, AvatarImage } from "./components/ui/avatar.tsx";
// import UserSettings from "./components/UserSettings.tsx";
// import { AddAccountDialog } from "./components/AddAccountDialog.tsx";

// type SidePanelProps = {
//   onSearchFocusRequest: (focusFn: () => void) => void;
//   onShortcutsChange?: (shortcuts: HotkeyMap) => void;
// };

// export default function SidePanel(props: SidePanelProps) {
//   const auth = useAuth();
//   const [driveService, setDriveService] = useState<DriveService | null>(null);
//   const [showCreateMenu, setShowCreateMenu] = useState(false);
//   const [initError, setInitError] = useState<string | null>(null);
//   const [storageQuota, setStorageQuota] = useState<StorageQuota | null>(null);
//   const createButtonRef = useRef<HTMLButtonElement>(null);
//   const fileExplorer = useFileExplorer(driveService);
//   const search = useSearch(fileExplorer);
//   const featureFlags = useFeatureFlags();
//   const searchInputRef = useRef<HTMLInputElement>(null);
//   const isMac = navigator.userAgent.toLowerCase().includes("mac");
//   const searchShortcut = isMac ? "⌥⇧/" : "Alt+Shift+/";
//   const [showSettings, setShowSettings] = useState(false);
//   const [showQuickMenu, setShowQuickMenu] = useState(false);
//   const { hotkeys } = useHotkeys({
//     onFocusSearch: () => searchInputRef.current?.focus(),
//     isPremium: featureFlags.isPremium,
//   });
//   const [searchFocusedIndex, setSearchFocusedIndex] = useState(-1);
//   const [showAddAccount, setShowAddAccount] = useState(false);
//   const quickMenuRef = useRef<HTMLDivElement>(null);
//   const avatarButtonRef = useRef<HTMLButtonElement>(null);

//   useEffect(() => {
//     if (auth.user) {
//       const CACHE_NAME = 'gdnav-cache';
//       const DRIVE_SERVICE_KEY = 'drive-service';

//       caches.open(CACHE_NAME)
//         .then(cache => cache.match(DRIVE_SERVICE_KEY))
//         .then(async response => {
//           if (response) {
//             const service = await response.json();
//             setDriveService(service);
//           } else {
//             const service = new DriveService(auth?.user?.credential!);
//             setDriveService(service);
            
//             // Store in cache
//             const cache = await caches.open(CACHE_NAME);
//             await cache.put(
//               DRIVE_SERVICE_KEY,
//               new Response(JSON.stringify(service))
//             );
//           }
//         })
//         .catch(error => {
//           console.error('Cache operation failed:', error);
//           const service = new DriveService(auth?.user?.credential!);
//           setDriveService(service);
//         });
//     } else {
//       setDriveService(null);
//       setStorageQuota(null);
//     }
//   }, [auth.user]);

//   useEffect(() => {
//     props.onSearchFocusRequest(() => {
//       searchInputRef.current?.focus();
//     });
//   }, [props.onSearchFocusRequest]);

//   useEffect(() => {
//     function handleClickOutside(event: MouseEvent) {
//       if (
//         quickMenuRef.current &&
//         avatarButtonRef.current &&
//         !quickMenuRef.current.contains(event.target as Node) &&
//         !avatarButtonRef.current.contains(event.target as Node)
//       ) {
//         setShowQuickMenu(false);
//       }
//     }

//     document.addEventListener("mousedown", () => handleClickOutside);
//     return () => {
//       document.removeEventListener("mousedown", () => handleClickOutside);
//     };
//   }, []);

//   const handleRetry = () => {
//     setInitError(null);
//     window.location.reload();
//   };

//   const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
//     const value = e.target.value;
//     search.setSearchQuery(value);
//     if (search.searchTimeoutRef.current) {
//       clearTimeout(search.searchTimeoutRef.current);
//     }
//   };

//   const handleSearchResultClick = (
//     file: GDFile,
//     path: string,
//     section: DriveCategory['id']
//   ) => {
//     fileExplorer.expandToFile({
//       section,
//       pathParts: path.split(" > "),
//       files: fileExplorer.getSectionFiles(section),
//     });
//   };

//   const handleLogout = async () => {
//     try {
//       await auth.signOut();
//     } catch (error) {
//       console.error("Logout failed:", error);
//     }
//   };

//   const handleSaveShortcuts = (newShortcuts: HotkeyMap) => {
//     props.onShortcutsChange?.(newShortcuts);
//   };

//   const handleSettingsClick = (e: MouseEvent) => {
//     e.stopPropagation();
//     setShowSettings((prev) => !prev);
//   };

//   const handleSearchNavigate = (direction: "up" | "down") => {
//     const results = search.getSearchResults();
//     if (direction === "up") {
//       setSearchFocusedIndex((prev) =>
//         prev <= 0 ? results.length - 1 : prev - 1
//       );
//     } else {
//       setSearchFocusedIndex((prev) =>
//         prev === results.length - 1 ? 0 : prev + 1
//       );
//     }
//   };

//   const handleSearchSelect = () => {
//     const results = search.getSearchResults();
//     if (searchFocusedIndex >= 0 && searchFocusedIndex < results.length) {
//       const result = results[searchFocusedIndex];
//       handleSearchResultClick(result, result.name, result.section as DriveCategory['id']);
//       search.setSearchQuery("");
//       setSearchFocusedIndex(-1);
//     }
//   };

//   const searchContainerRef = useRef<HTMLDivElement>(null);

//   useHotkeys({
//     containerRef: searchContainerRef,
//     onNavigate: handleSearchNavigate,
//     onSelect: handleSearchSelect,
//     onCollapse: () => {
//       search.setSearchQuery("");
//       setSearchFocusedIndex(-1);
//     },
//   });

//   if (auth.loading) return <div>Loading...</div>;
//   if (!auth.user) return <GoogleSignIn />;
//   if (initError) {
//     return <ErrorMessage message={initError} onRetry={handleRetry} />;
//   }

//   if (fileExplorer.loading) {
//     return (
//       <div className="h-screen flex flex-col bg-zinc-100 dark:bg-zinc-900">
//         <div className="h-full w-full flex flex-col bg-white dark:bg-zinc-800">
//           <LoadingSpinner />
//         </div>
//       </div>
//     );
//   }

//   if (fileExplorer.error || !driveService) {
//     return (
//       <div className="h-screen flex flex-col bg-zinc-100 dark:bg-zinc-900">
//         <div className="h-full w-full flex flex-col bg-white dark:bg-zinc-800">
//           <ErrorMessage
//             message={fileExplorer.error || "Drive service not initialized"}
//             onRetry={handleRetry}
//           />
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="h-screen flex flex-col relative bg-zinc-100 dark:bg-zinc-900 rounded-md">
//       <div className="h-full w-full flex flex-col bg-white dark:bg-zinc-800">
//         <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-700 relative z-50 flex justify-between items-center">
//           <div className="flex-1">
//             <div className="relative">
//               <div
//                 className={`transform transition-all duration-200 ease-in-out ${
//                   !showSettings
//                     ? "translate-x-0 opacity-100"
//                     : "-translate-x-full opacity-0 absolute"
//                 }`}
//               >
//                 <h1 className="text-lg leading-tight font-semibold text-zinc-900 dark:text-white">
//                   GDrive Nav
//                 </h1>
//               </div>

//               <div
//                 className={`transform transition-all duration-200 ease-in-out ${
//                   showSettings
//                     ? "translate-x-0 opacity-100"
//                     : "translate-x-full opacity-0 absolute"
//                 }`}
//               >
//                 <div className="flex items-center gap-2">
//                   <Button
//                     variant="ghost"
//                     size="icon"
//                     onClick={() => setShowSettings(false)}
//                     className="text-zinc-600 dark:text-zinc-400"
//                   >
//                     <XIcon className="h-4 w-4" />
//                   </Button>
//                 </div>
//               </div>
//             </div>
//           </div>
//           <div
//             className="flex items-center gap-2 z-30"
//             onClick={(e) => console.log("Parent div clicked")}
//           >
//             <Button
//               variant="ghost"
//               size="icon"
//               onClick={handleSettingsClick}
//               className="text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-700"
//               title="Shortcuts"
//             >
//               <Settings className="h-4 w-4" />
//               {!featureFlags.isPremium && (
//                 <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center">
//                   <span className="text-[8px] text-white">⭐</span>
//                 </span>
//               )}
//             </Button>
//             <Button
//               variant="ghost"
//               size="icon"
//               onClick={() => document.documentElement.classList.toggle("dark")}
//               className="text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700"
//               disabled={!featureFlags.isPremium}
//               title={!featureFlags.isPremium ? "Upgrade to unlock" : ""}
//             >
//               <SunIcon className="h-4 w-4 dark:hidden" />
//               <MoonIcon className="h-4 w-4 hidden dark:block" />
//             </Button>
//             <Button
//               variant="ghost"
//               size="icon"
//               disabled
//               className="text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-700"
//               title="Switch account (coming soon)"
//             >
//               <Users className="h-4 w-4" />
//             </Button>
//             <Button
//               ref={avatarButtonRef}
//               variant="ghost"
//               className="relative h-8 w-8 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-700"
//               onClick={() => {
//                 console.log("User menu clicked");
//                 setShowQuickMenu(!showQuickMenu);
//               }}
//             >
//               <Avatar className="h-8 w-8">
//                 <AvatarImage
//                   src={auth.user?.photoURL}
//                   alt={auth.user?.name || "User"}
//                 />
//                 <AvatarFallback>
//                   {auth.user?.name?.charAt(0)?.toUpperCase() || "U"}
//                 </AvatarFallback>
//               </Avatar>
//             </Button>
//           </div>
//         </div>

//         {showQuickMenu && (
//           <div
//             ref={quickMenuRef}
//             className="absolute right-4 top-14 w-48 rounded-md shadow-lg bg-white dark:bg-zinc-800 ring-1 ring-black ring-opacity-5 z-50"
//           >
//             <div className="py-1">
//               {auth.activeAccounts.map((account) => (
//                 <button
//                   type="button"
//                   key={account.email ?? "unknown"}
//                   onClick={() => {
//                     if (account.email) {
//                       auth.switchAccount(account.email);
//                       setShowQuickMenu(false);
//                     }
//                   }}
//                   className={`w-full px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-zinc-700 flex items-center gap-2 ${
//                     auth.user?.email === account.email
//                       ? "bg-gray-50 dark:bg-zinc-700"
//                       : ""
//                   }`}
//                 >
//                   <Avatar className="h-6 w-6">
//                     <AvatarImage
//                       src={account.photoURL}
//                       alt={account.name || "User"}
//                     />
//                     <AvatarFallback>
//                       {account.name?.charAt(0)?.toUpperCase() || "U"}
//                     </AvatarFallback>
//                   </Avatar>
//                   <span className="flex-1 text-left">{account.email}</span>
//                 </button>
//               ))}
//               <button
//                 type="button"
//                 onClick={() => {}}
//                 disabled
//                 className="w-full px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-zinc-700 flex items-center gap-2"
//               >
//                 <UserPlus className="h-4 w-4" />
//                 <div className="flex flex-col items-start">
//                   <span className="text-zinc-400 dark:text-zinc-500">
//                     Add account
//                   </span>
//                   <span className="text-xs text-zinc-400 dark:text-zinc-500">
//                     (coming soon)
//                   </span>
//                 </div>
//               </button>
//               <div className="border-t border-gray-200 dark:border-zinc-700 my-1" />
//               <button
//                 type="button"
//                 onClick={handleLogout}
//                 className="w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-zinc-700 flex items-center gap-2"
//               >
//                 <LogOut className="h-4 w-4" />
//                 <span>Sign out</span>
//               </button>
//             </div>
//           </div>
//         )}

//         <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-700 flex gap-2">
//           <div ref={searchContainerRef} className="relative flex-1">
//             <input
//               ref={searchInputRef}
//               type="text"
//               placeholder={`Search (${searchShortcut})`}
//               value={search.searchQuery}
//               onChange={handleSearchChange}
//               className="w-full pl-9 pr-8 py-1.5 bg-zinc-100 dark:bg-zinc-800 border-transparent hover:border-zinc-200 dark:hover:border-zinc-600 focus:border-zinc-200 dark:focus:border-zinc-500 text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 dark:placeholder-zinc-400 border rounded-lg text-sm focus:outline-none transition-colors"
//             />
//             <SearchIcon className="w-4 h-4 text-zinc-500 dark:text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
//             {search.searchQuery && (
//               <Button
//                 variant="ghost"
//                 size="icon"
//                 className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6"
//                 onClick={() => {
//                   search.setSearchQuery("");
//                   setSearchFocusedIndex(-1);
//                 }}
//               >
//                 <XIcon className="h-4 w-4" />
//               </Button>
//             )}
//           </div>
//           <Button
//             ref={createButtonRef}
//             variant="ghost"
//             size="icon"
//             onClick={() => setShowCreateMenu(!showCreateMenu)}
//           >
//             <PlusIcon className="h-4 w-4" />
//           </Button>
//           {showCreateMenu && driveService && (
//             <CreateMenu
//               onClose={() => setShowCreateMenu(false)}
//               driveService={driveService}
//               onFileCreated={() =>
//                 fileExplorer.handleFolderLoad({
//                   folderId: "",
//                   section: fileExplorer.activeSection,
//                 })
//               }
//             />
//           )}
//         </div>

//         <div
//           className="px-2 space-y-1 flex-1 overflow-y-auto overflow-x-hidden text-zinc-900 dark:text-zinc-100 relative isolate
// scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-600 
// scrollbar-track-transparent hover:scrollbar-thumb-zinc-400 
// dark:hover:scrollbar-thumb-zinc-500"
//         >
//           <div
//             className={`transform transition-all duration-200 ease-in-out ${
//               !showSettings
//                 ? "translate-x-0 opacity-100 relative"
//                 : "-translate-x-full opacity-0 absolute inset-0"
//             }`}
//           >
//             {driveService &&
//               driveService.getCategories().map((category) => {
//                 const IconComponent = category.icon;
//                 return (
//                   <NavSection
//                     key={category.id}
//                     icon={<IconComponent className="w-4 h-4 shrink-0" />}
//                     label={category.label}
//                     section={category.id as DriveCategory['id']}
//                     activeSection={fileExplorer.activeSection}
//                     expandedSections={fileExplorer.expandedSections}
//                     expandedFolders={fileExplorer.expandedFolders}
//                     loading={fileExplorer.loading}
//                     files={search.getFilteredFiles(category.id)}
//                     driveService={driveService}
//                     onToggleSection={fileExplorer.toggleSection}
//                     onToggleFolder={fileExplorer.toggleFolder}
//                     onFolderLoad={fileExplorer.handleFolderLoad}
//                   />
//                 );
//               })}
//           </div>

//           <div
//             className={`transform transition-all duration-200 ease-in-out ${
//               showSettings
//                 ? "translate-x-0 opacity-100 relative"
//                 : "translate-x-full opacity-0 absolute inset-0"
//             }`}
//           >
//             <UserSettings
//               shortcuts={hotkeys}
//               isPremium={featureFlags.isPremium}
//               onSaveShortcuts={handleSaveShortcuts}
//               onClose={() => {
//                 console.log("Closing settings");
//                 setShowSettings(false);
//               }}
//             />
//           </div>
//         </div>

//         {storageQuota && (
//           <StorageUsage
//             usedStorage={storageQuota.usedStorage}
//             maxStorage={storageQuota.maxStorage}
//             usageInDrive={storageQuota.usageInDrive}
//             usageInTrash={storageQuota.usageInTrash}
//           />
//         )}

//         <div className="px-3 py-2 border-t border-zinc-200">
//           <div className="flex items-center justify-between mb-2">
//             <span className="text-sm text-zinc-600">
//               {featureFlags.subscription.tier === "active"
//                 ? "Active Plan"
//                 : "Inactive Plan"}
//             </span>
//             {featureFlags.subscription.tier === "inactive" && (
//               <a
//                 type="button"
//                 href="https://gdnav.netlify.app/pricing"
//                 target="_blank"
//                 className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
//               >
//                 {featureFlags.isUpdating && (
//                   <Loader2Icon className="w-3 h-3 animate-spin" />
//                 )}
//                 Upgrade
//               </a>
//             )}
//           </div>
//           {featureFlags.subscription.expiresAt && (
//             <div className="text-xs text-zinc-500">
//               Expires:{" "}
//               {new Date(
//                 featureFlags.subscription.expiresAt
//               ).toLocaleDateString()}
//             </div>
//           )}
//         </div>

//         {/* Premium features */}
//         {featureFlags.isPremium && <>{/* Premium-only UI elements */}</>}

//         {showAddAccount && (
//           <AddAccountDialog onClose={() => setShowAddAccount(false)} />
//         )}
//       </div>
//     </div>
//   );
// }
