import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface AddToCollectionDialogProps {
  itemId: string;
  itemType: string;
  title: string;
  posterUrl?: string;
  year?: string;
}

const AddToCollectionDialog = ({ itemId, itemType, title, posterUrl, year }: AddToCollectionDialogProps) => {
  const [selectedCollections, setSelectedCollections] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.user || null;
    },
  });

  const { data: collections = [] } = useQuery({
    queryKey: ["collections", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("collections")
        .select("*, collection_items(*)")
        .eq("user_id", user.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user && open,
  });

  const handleToggleCollection = (collectionId: string) => {
    const newSelected = new Set(selectedCollections);
    if (newSelected.has(collectionId)) {
      newSelected.delete(collectionId);
    } else {
      newSelected.add(collectionId);
    }
    setSelectedCollections(newSelected);
  };

  const handleSubmit = async () => {
    if (!user) return;
    setIsSubmitting(true);

    for (const collectionId of selectedCollections) {
      const collection = collections.find((c: any) => c.id === collectionId);
      const alreadyInCollection = collection?.collection_items?.some(
        (item: any) => item.item_id === itemId && item.item_type === itemType
      );

      if (alreadyInCollection) {
        await supabase
          .from("collection_items")
          .delete()
          .eq("collection_id", collectionId)
          .eq("item_id", itemId)
          .eq("item_type", itemType);
      } else {
        await supabase.from("collection_items").insert({
          collection_id: collectionId,
          item_id: itemId,
          item_type: itemType,
          title,
          poster_url: posterUrl,
          year,
        });
      }
    }

    toast.success("Collections updated");
    queryClient.invalidateQueries({ queryKey: ["collections", user.id] });
    setIsSubmitting(false);
    setOpen(false);
    setSelectedCollections(new Set());
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Plus className="w-4 h-4 mr-2" />
          Add to Collection
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add to Collection</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {collections.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No collections yet. Create one in your dashboard!
            </p>
          ) : (
            <div className="space-y-3">
              {collections.map((collection: any) => {
                const isInCollection = collection.collection_items?.some(
                  (item: any) => item.item_id === itemId && item.item_type === itemType
                );
                return (
                  <div key={collection.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={collection.id}
                      checked={selectedCollections.has(collection.id)}
                      onCheckedChange={() => handleToggleCollection(collection.id)}
                    />
                    <label
                      htmlFor={collection.id}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                    >
                      {collection.name}
                      {isInCollection && (
                        <span className="ml-2 text-xs text-muted-foreground">(in collection)</span>
                      )}
                    </label>
                  </div>
                );
              })}
            </div>
          )}
          <Button onClick={handleSubmit} disabled={isSubmitting || selectedCollections.size === 0} className="w-full">
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddToCollectionDialog;
