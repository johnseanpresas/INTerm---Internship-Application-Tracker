import { useEffect, useState } from "react"
import { apiFetch as fetch } from "@/lib/api"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

import { Building2, ExternalLink, Pencil, Plus, Trash2 } from "lucide-react"

type Company = {
    id: number
    name: string
    website?: string | null
    industry?: string | null
    location?: string | null
    notes?: string | null
}

function Companies() {
    const [companies, setCompanies] = useState<Company[]>([])

    const [name, setName] = useState("")
    const [website, setWebsite] = useState("")
    const [industry, setIndustry] = useState("")
    const [location, setLocation] = useState("")
    const [notes, setNotes] = useState("")

    const [search, setSearch] = useState("")
    const [error, setError] = useState("")

    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [companyToEdit, setCompanyToEdit] = useState<Company | null>(null)
    const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null)

    // Load only the companies belonging to the signed-in user.
    useEffect(() => {
        async function loadCompanies() {
            try {
                const response = await fetch("http://localhost:3000/api/companies")

                if (!response.ok) {
                    throw new Error("Failed to fetch companies")
                }

                const data: Company[] = await response.json()
                setCompanies(data)
            } catch (error) {
                console.error("Error loading companies:", error)
                setError("Failed to load companies.")
            }
        }

        loadCompanies()
    }, [])

    function resetForm() {
        setName("")
        setWebsite("")
        setIndustry("")
        setLocation("")
        setNotes("")
        setCompanyToEdit(null)
        setError("")
    }

    function handleStartAdd() {
        resetForm()
        setIsDialogOpen(true)
    }

    function handleStartEdit(company: Company) {
        setCompanyToEdit(company)

        setName(company.name)
        setWebsite(company.website || "")
        setIndustry(company.industry || "")
        setLocation(company.location || "")
        setNotes(company.notes || "")
        setError("")

        setIsDialogOpen(true)
    }

    async function handleSaveCompany() {
        if (!name.trim()) {
            setError("Please enter a company name.")
            return
        }

        try {
            const url = companyToEdit
                ? `http://localhost:3000/api/companies/${companyToEdit.id}`
                : "http://localhost:3000/api/companies"

            const response = await fetch(url, {
                method: companyToEdit ? "PUT" : "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name,
                    website,
                    industry,
                    location,
                    notes,
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                setError(data.message || "Failed to save company.")
                return
            }

            if (companyToEdit) {
                setCompanies((currentCompanies) =>
                    currentCompanies.map((company) =>
                        company.id === data.id ? data : company
                    )
                )
            } else {
                setCompanies((currentCompanies) =>
                    [...currentCompanies, data].sort((a, b) =>
                        a.name.localeCompare(b.name)
                    )
                )
            }

            setIsDialogOpen(false)
            resetForm()
        } catch (error) {
            console.error("Error saving company:", error)
            setError("Failed to save company. Please try again.")
        }
    }

    async function handleDeleteCompany() {
        if (!companyToDelete) {
            return
        }

        try {
            const response = await fetch(
                `http://localhost:3000/api/companies/${companyToDelete.id}`,
                {
                    method: "DELETE",
                }
            )

            if (!response.ok) {
                setError("Failed to delete company.")
                return
            }

            setCompanies((currentCompanies) =>
                currentCompanies.filter(
                    (company) => company.id !== companyToDelete.id
                )
            )

            setCompanyToDelete(null)
        } catch (error) {
            console.error("Error deleting company:", error)
            setError("Failed to delete company.")
        }
    }

    const filteredCompanies = companies.filter((company) => {
        const searchText = search.toLowerCase()

        return (
            company.name.toLowerCase().includes(searchText) ||
            company.industry?.toLowerCase().includes(searchText) ||
            company.location?.toLowerCase().includes(searchText)
        )
    })

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Companies</h1>
                    <p className="text-muted-foreground">
                        Keep track of companies you're interested in.
                    </p>
                </div>

                <Button onClick={handleStartAdd}>
                    <Plus />
                    Add Company
                </Button>
            </div>

            <Input
                placeholder="Search companies..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="max-w-md"
            />

            {error && !isDialogOpen && (
                <p className="text-sm text-destructive">{error}</p>
            )}

            {filteredCompanies.length === 0 ? (
                <div className="rounded-lg border border-dashed p-10 text-center">
                    <Building2 className="mx-auto mb-4 size-10 text-muted-foreground" />

                    <h2 className="font-semibold">
                        {companies.length === 0
                            ? "No companies yet"
                            : "No companies found"}
                    </h2>

                    <p className="mt-1 text-sm text-muted-foreground">
                        {companies.length === 0
                            ? "Add companies you want to research or apply to."
                            : "Try a different search."}
                    </p>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {filteredCompanies.map((company) => (
                        <Card key={company.id}>
                            <CardHeader>
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <CardTitle>{company.name}</CardTitle>

                                        {company.industry && (
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                {company.industry}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleStartEdit(company)}
                                        >
                                            <Pencil />
                                        </Button>

                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setCompanyToDelete(company)}
                                        >
                                            <Trash2 />
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-3 text-sm">
                                <div>
                                    <span className="font-medium">Location:</span>{" "}
                                    {company.location || "—"}
                                </div>

                                {company.website && (
                                    <a
                                        href={company.website}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex items-center gap-1 underline"
                                    >
                                        Visit website
                                        <ExternalLink className="size-3" />
                                    </a>
                                )}

                                {company.notes && (
                                    <p className="text-muted-foreground">
                                        {company.notes}
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <Dialog
                open={isDialogOpen}
                onOpenChange={(open) => {
                    setIsDialogOpen(open)

                    if (!open) {
                        resetForm()
                    }
                }}
            >
                <DialogTrigger render={<span className="hidden" />} />

                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {companyToEdit ? "Edit Company" : "Add Company"}
                        </DialogTitle>

                        <DialogDescription>
                            Save useful information about a company.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="companyName">Company Name *</Label>
                            <Input
                                id="companyName"
                                placeholder="e.g. Canva"
                                value={name}
                                onChange={(event) => setName(event.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="industry">Industry</Label>
                            <Input
                                id="industry"
                                placeholder="e.g. Technology"
                                value={industry}
                                onChange={(event) => setIndustry(event.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="location">Location</Label>
                            <Input
                                id="location"
                                placeholder="e.g. Makati City"
                                value={location}
                                onChange={(event) => setLocation(event.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="website">Website</Label>
                            <Input
                                id="website"
                                placeholder="https://www.example.com"
                                value={website}
                                onChange={(event) => setWebsite(event.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="notes">Notes</Label>
                            <Input
                                id="notes"
                                placeholder="Anything useful about this company"
                                value={notes}
                                onChange={(event) => setNotes(event.target.value)}
                            />
                        </div>

                        {error && (
                            <p className="text-sm text-destructive">{error}</p>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsDialogOpen(false)}
                        >
                            Cancel
                        </Button>

                        <Button onClick={handleSaveCompany}>
                            {companyToEdit ? "Save Changes" : "Add Company"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog
                open={companyToDelete !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setCompanyToDelete(null)
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Company?</DialogTitle>

                        <DialogDescription>
                            {companyToDelete
                                ? `This will delete ${companyToDelete.name}.`
                                : "This company will be deleted."}
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setCompanyToDelete(null)}
                        >
                            Cancel
                        </Button>

                        <Button
                            variant="destructive"
                            onClick={handleDeleteCompany}
                        >
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default Companies