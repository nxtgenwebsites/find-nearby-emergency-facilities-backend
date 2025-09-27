import Visitor from "../models/visitorModel.js";

// Increase counter
export const increaseVisitor = async (req, res) => {
    try {
        let counter = await Visitor.findOne();

        if (!counter) {
            counter = new Visitor({ total: 1 });
        } else {
            counter.total += 1;
        }

        await counter.save();
        res.json({ totalVisitors: counter.total });
    } catch (error) {
        res.status(500).json({ message: "Error updating visitors", error });
    }
};

// Get total visitors
export const getVisitors = async (req, res) => {
    try {
        let counter = await Visitor.findOne();
        res.json({ totalVisitors: counter ? counter.total : 0 });
    } catch (error) {
        res.status(500).json({ message: "Error fetching visitors", error });
    }
};
